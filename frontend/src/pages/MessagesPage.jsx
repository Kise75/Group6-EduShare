import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import api, { parseApiError } from "../services/api";

const CHAT_POLL_INTERVAL = 4000;

const getEntityId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || "";
};

const resolveConversationLabel = (conversation, partner, t) => {
  if (partner?.role === "admin") {
    return t("messages.roleAdmin");
  }

  if (!conversation?.listing) {
    return t("messages.roleMember");
  }

  return getEntityId(conversation.listing?.seller) === getEntityId(partner)
    ? t("messages.roleSeller")
    : t("messages.roleBuyer");
};

const resolveConversationContext = (conversation, partner, t) => {
  if (conversation?.listing?.title) {
    return conversation.listing.title;
  }

  return partner?.role === "admin" ? t("messages.adminHelp") : t("messages.directChat");
};

function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedConversationId = searchParams.get("conversation") || "";
  const { user } = useAuth();
  const { formatDateTime, t } = useI18n();
  const chatLogRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(requestedConversationId);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [startingChatId, setStartingChatId] = useState("");
  const [error, setError] = useState("");

  const loadConversations = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await api.get("/messages");
      const list = response.data || [];
      setConversations(list);

      if (!selectedId) {
        const preferredId =
          requestedConversationId && list.some((item) => item._id === requestedConversationId)
            ? requestedConversationId
            : list[0]?._id || "";

        if (preferredId) {
          setSelectedId(preferredId);
        }
      } else if (selectedId && !list.some((item) => item._id === selectedId)) {
        setSelectedId(list[0]?._id || "");
      }

      if (!list.length) {
        setSelectedChat(null);
      }
    } catch (requestError) {
      if (!silent) {
        setError(parseApiError(requestError, "Cannot load messages"));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadConversation = async (conversationId, silent = false) => {
    if (!conversationId) {
      setSelectedChat(null);
      return;
    }

    try {
      const response = await api.get(`/messages/${conversationId}`);
      setSelectedChat(response.data);
    } catch (requestError) {
      if (!silent) {
        setError(parseApiError(requestError, "Cannot open conversation"));
      }
    }
  };

  useEffect(() => {
    if (requestedConversationId && requestedConversationId !== selectedId) {
      setSelectedId(requestedConversationId);
    }
  }, [requestedConversationId]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    let active = true;
    const role = peopleQuery.trim() ? "" : "admin";

    if (!role && peopleQuery.trim().length < 2) {
      setPeopleResults([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setDiscovering(true);
      try {
        const response = await api.get("/users/search", {
          params: {
            q: peopleQuery.trim() || undefined,
            role: role || undefined,
          },
        });

        if (active) {
          setPeopleResults(response.data.users || []);
        }
      } catch (requestError) {
        if (active) {
          setError(parseApiError(requestError, "Cannot search users"));
        }
      } finally {
        if (active) {
          setDiscovering(false);
        }
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [peopleQuery, user?.id]);

  useEffect(() => {
    setError("");

    if (!selectedId) {
      setSelectedChat(null);
      return;
    }

    loadConversation(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadConversations(true);
      if (selectedId) {
        loadConversation(selectedId, true);
      }
    }, CHAT_POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [selectedId, user?.id]);

  useEffect(() => {
    if (!chatLogRef.current) {
      return;
    }

    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [selectedChat?.messages?.length, selectedId]);

  const filteredConversations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const partner =
        getEntityId(conversation.participant1) === user?.id
          ? conversation.participant2
          : conversation.participant1;

      return [partner?.name, conversation.listing?.title, conversation.messages?.at(-1)?.text]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword));
    });
  }, [conversations, searchTerm, user?.id]);

  const selectedConversationSummary = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedId) || null,
    [conversations, selectedId]
  );

  const chatPartner = useMemo(() => {
    if (!selectedChat || !user) {
      return null;
    }

    if (getEntityId(selectedChat.participant1) === user.id) {
      return selectedChat.participant2;
    }

    return selectedChat.participant1;
  }, [selectedChat, user]);

  const chatPartnerRole = useMemo(() => {
    if (!selectedChat || !chatPartner) {
      return "";
    }

    return resolveConversationLabel(selectedChat, chatPartner, t);
  }, [chatPartner, selectedChat, t]);

  const openPersonConversation = async (personId) => {
    setError("");
    setStartingChatId(personId);

    try {
      const response = await api.post("/messages/start", {
        recipientId: personId,
      });
      setSelectedId(response.data._id);
      setSearchParams({ conversation: response.data._id });
      await loadConversations(true);
      await loadConversation(response.data._id, true);
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot start conversation"));
    } finally {
      setStartingChatId("");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!text.trim() || !selectedId) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await api.post(`/messages/${selectedId}/send`, { text: text.trim() });
      setSelectedChat(response.data.conversation);
      setText("");
      await loadConversations(true);
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot send message"));
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conversationId) => {
    setSelectedId(conversationId);
    if (conversationId) {
      setSearchParams({ conversation: conversationId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <AppShell>
      <h1>{t("messages.title")}</h1>
      {error ? <p className="feedback error">{error}</p> : null}

      <section className="chat-layout">
        <aside className="chat-list">
          <input
            className="conversation-search"
            placeholder={t("messages.searchConversations")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="chat-discovery">
            <div className="chat-discovery-head">
              <strong>{t("messages.findPeople")}</strong>
              <small className="muted">{t("messages.contactAdmin")}</small>
            </div>
            <input
              className="conversation-search"
              placeholder={t("messages.searchPeople")}
              value={peopleQuery}
              onChange={(event) => setPeopleQuery(event.target.value)}
            />

            {discovering ? <p className="muted">{t("messages.searchingPeople")}</p> : null}

            {!discovering && peopleResults.length ? (
              <div className="person-result-list">
                {peopleResults.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="person-result-item"
                    disabled={startingChatId === person.id}
                    onClick={() => openPersonConversation(person.id)}
                  >
                    <div>
                      <strong>{person.name}</strong>
                      <span className="muted">
                        {person.role === "admin" ? t("messages.quickAdmin") : person.major || t("messages.roleMember")}
                      </span>
                    </div>
                    <small>{startingChatId === person.id ? t("messages.startingChat") : person.email}</small>
                  </button>
                ))}
              </div>
            ) : null}

            {!discovering && !peopleResults.length && (peopleQuery.trim().length >= 2 || !peopleQuery.trim()) ? (
              <p className="muted">{t("messages.noPeople")}</p>
            ) : null}
          </div>

          {loading ? <p className="muted">{t("messages.loadingConversations")}</p> : null}

          {!loading && !filteredConversations.length ? (
            <div className="conversation-empty">
              <p>{t("messages.emptyTitle")}</p>
              <p className="muted">{t("messages.emptyHint")}</p>
            </div>
          ) : null}

          {filteredConversations.map((conversation) => {
            const partner =
              getEntityId(conversation.participant1) === user?.id
                ? conversation.participant2
                : conversation.participant1;
            const last = conversation.messages?.[conversation.messages.length - 1];
            const unreadCount =
              conversation.messages?.filter(
                (message) => !message.isRead && getEntityId(message.senderId) !== user?.id
              ).length || 0;
            const partnerRole = resolveConversationLabel(conversation, partner, t);
            const contextLabel = resolveConversationContext(conversation, partner, t);

            return (
              <button
                key={conversation._id}
                type="button"
                onClick={() => selectConversation(conversation._id)}
                className={`conversation-item ${selectedId === conversation._id ? "active" : ""}`}
              >
                <div className="conversation-topline">
                  <strong>{partner?.name || "User"}</strong>
                  {unreadCount ? <span className="unread-badge">{unreadCount}</span> : null}
                </div>
                <span className="participant-role">
                  {partnerRole} | {contextLabel}
                </span>
                <span>{last?.text || t("messages.emptyChat")}</span>
                <small className="conversation-time">
                  {formatDateTime(last?.timestamp || conversation.lastMessage, {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </small>
              </button>
            );
          })}
        </aside>

        <section className="chat-pane">
          <header className="chat-header">
            <div>
              <h3>{chatPartner?.name || t("messages.selectConversation")}</h3>
              <p className="muted">
                {chatPartnerRole ? `${chatPartnerRole} | ` : ""}
                {selectedChat
                  ? resolveConversationContext(selectedChat, chatPartner, t)
                  : t("messages.selectConversationHint")}
              </p>
            </div>
            {selectedConversationSummary?.lastMessage ? (
              <span className="muted">
                {t("messages.updated")}{" "}
                {formatDateTime(selectedConversationSummary.lastMessage, {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            ) : null}
          </header>

          <div className="chat-log" ref={chatLogRef}>
            {selectedChat?.messages?.length ? (
              selectedChat.messages.map((message, index) => {
                const mine = getEntityId(message.senderId) === user?.id;

                return (
                  <div key={`${message.timestamp}-${index}`} className={`bubble ${mine ? "mine" : ""}`}>
                    <p>{message.text}</p>
                    <small className="bubble-meta">
                      {formatDateTime(message.timestamp, {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </small>
                  </div>
                );
              })
            ) : (
              <div className="conversation-empty">
                <p>{t("messages.emptyChat")}</p>
                <p className="muted">{t("messages.emptyChatHint")}</p>
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={sendMessage}>
            <input
              value={text}
              placeholder={t("messages.typePlaceholder")}
              disabled={!selectedId || sending}
              onChange={(event) => setText(event.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={!selectedId || sending || !text.trim()}>
              {sending ? t("messages.sending") : t("messages.send")}
            </button>
          </form>
        </section>
      </section>
    </AppShell>
  );
}

export default MessagesPage;
