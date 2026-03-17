import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import AppShell from "../components/AppShell";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import api, { parseApiError } from "../services/api";

function MapViewport({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) {
      return;
    }

    map.flyTo(center, 17, { duration: 0.6 });
  }, [center, map]);

  return null;
}

function MeetupPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { theme } = useTheme();
  const [locations, setLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [listingLocation, setListingLocation] = useState(null);
  const [form, setForm] = useState({
    location: "",
    date: "",
    time: "",
  });
  const [existingMeetup, setExistingMeetup] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadMeetupPage = async () => {
    try {
      const [locationResponse, meetupResponse, suggestionResponse] = await Promise.all([
        api.get("/meetups/campus-locations"),
        api.get(`/meetups/${listingId}`),
        api.get(`/meetups/suggestions/${listingId}`),
      ]);

      const locationList = locationResponse.data || [];
      const meetup = meetupResponse.data || null;
      const nextSuggestions = suggestionResponse.data.suggestions || [];
      const preferredListingLocation = suggestionResponse.data.listingLocation || null;

      setLocations(locationList);
      setExistingMeetup(meetup);
      setSuggestions(nextSuggestions);
      setListingLocation(preferredListingLocation);

      if (meetup) {
        setForm({
          location: meetup.location || "",
          date: meetup.date ? new Date(meetup.date).toISOString().slice(0, 10) : "",
          time: meetup.time || "",
        });
        return;
      }

      const topSuggestion = nextSuggestions[0]?.name || locationList[0]?.name || "";
      setForm((prev) => ({
        ...prev,
        location: prev.location || topSuggestion,
      }));
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot load meetup planner"));
    }
  };

  useEffect(() => {
    loadMeetupPage();
  }, [listingId]);

  const selectedLocation = useMemo(() => {
    if (!locations.length) {
      return null;
    }

    const normalizedValue = String(form.location || "").trim().toLowerCase();
    return (
      locations.find((item) => {
        const aliases = [item.name, ...(item.aliases || [])].map((value) =>
          String(value).trim().toLowerCase()
        );
        return aliases.includes(normalizedValue);
      }) || locations[0]
    );
  }, [form.location, locations]);

  const preferredLocation = useMemo(() => {
    if (!listingLocation || !locations.length) {
      return null;
    }

    const normalizedName = String(listingLocation.id || listingLocation.name || "")
      .trim()
      .toLowerCase();

    return (
      locations.find((item) =>
        [item.id, item.name, ...(item.aliases || [])]
          .filter(Boolean)
          .map((value) => String(value).trim().toLowerCase())
          .includes(normalizedName)
      ) || null
    );
  }, [listingLocation, locations]);

  const mapCenter = selectedLocation
    ? [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]
    : [10.03215, 105.76831];
  const tileLayer =
    theme === "dark"
      ? {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
        }
      : {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        };

  const chooseLocation = (locationName) => {
    setForm((prev) => ({ ...prev, location: locationName }));
  };

  const saveMeetupProposal = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    try {
      const response = await api.post("/meetups", { ...form, listingId });
      setExistingMeetup(response.data.meetup);
      setInfo(response.data.message || "Meetup scheduled");
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot schedule meetup"));
    }
  };

  const confirmMeetup = async () => {
    if (!existingMeetup?._id) {
      return;
    }

    try {
      const response = await api.put(`/meetups/${existingMeetup._id}/confirm`);
      setExistingMeetup(response.data.meetup);
      setInfo(response.data.message || "Meetup confirmed");
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot confirm meetup"));
    }
  };

  const completeMeetup = async () => {
    if (!existingMeetup?._id) {
      return;
    }

    try {
      const response = await api.put(`/meetups/${existingMeetup._id}/complete`);
      setExistingMeetup(response.data.meetup);
      setInfo(response.data.message || "Meetup completed");
      setTimeout(() => navigate("/transactions"), 800);
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot complete meetup"));
    }
  };

  const cancelMeetup = async () => {
    if (!existingMeetup?._id) {
      return;
    }

    try {
      const response = await api.put(`/meetups/${existingMeetup._id}/cancel`);
      setExistingMeetup(response.data.meetup);
      setInfo(response.data.message || "Meetup cancelled");
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot cancel meetup"));
    }
  };

  return (
    <AppShell>
      <h1>{t("meetup.title")}</h1>

      <section className="meetup-layout">
        <div className="meetup-map-card">
          <MapContainer center={mapCenter} zoom={17} scrollWheelZoom className="meetup-map">
            <TileLayer attribution={tileLayer.attribution} url={tileLayer.url} />
            <MapViewport center={mapCenter} />

            {locations.map((item) => (
              <Marker
                key={item.id}
                position={[item.coordinates.lat, item.coordinates.lng]}
                eventHandlers={{ click: () => chooseLocation(item.name) }}
              >
                <Popup>
                  <strong>{item.name}</strong>
                  <br />
                  {item.description || t("meetup.safePoint")}
                </Popup>
              </Marker>
            ))}

            {selectedLocation ? (
              <Circle
                center={[selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]}
                radius={36}
                pathOptions={{ color: "#1d71e8", fillColor: "#1d71e8", fillOpacity: 0.18 }}
              />
            ) : null}

            {preferredLocation && preferredLocation.id !== selectedLocation?.id ? (
              <Circle
                center={[preferredLocation.coordinates.lat, preferredLocation.coordinates.lng]}
                radius={28}
                pathOptions={{ color: "#ef7f1a", fillColor: "#ef7f1a", fillOpacity: 0.12 }}
              />
            ) : null}
          </MapContainer>

          <div className="map-caption">
            <p>{t("meetup.caption")}</p>
            {existingMeetup ? (
              <p className="muted">
                {t("meetup.currentStatus")}: <strong>{existingMeetup.status}</strong>.{" "}
                {t("meetup.buyerConfirmed")}:{" "}
                {existingMeetup.buyerConfirmed ? t("meetup.yes") : t("meetup.no")} |{" "}
                {t("meetup.sellerConfirmed")}:{" "}
                {existingMeetup.sellerConfirmed ? t("meetup.yes") : t("meetup.no")}
              </p>
            ) : null}
          </div>

          <div className="map-key">
            {selectedLocation ? (
              <div className="map-key-item active">
                <strong>{t("meetup.selectedPoint")}</strong>
                <span>{selectedLocation.name}</span>
              </div>
            ) : null}
            {preferredLocation ? (
              <div className="map-key-item listing">
                <strong>{t("meetup.listingPoint")}</strong>
                <span>{preferredLocation.name}</span>
              </div>
            ) : null}
          </div>

          {suggestions.length ? (
            <div className="meetup-suggestion-list">
              {suggestions.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`meetup-suggestion-card ${form.location === item.name ? "active" : ""}`}
                  onClick={() => chooseLocation(item.name)}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {t("meetup.score")} {item.score}
                  </span>
                  <small>{item.reason}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <form className="panel-card form-stack" onSubmit={saveMeetupProposal}>
          <h2>{t("meetup.title")}</h2>
          <label>{t("meetup.location")}</label>
          <select
            required
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
          >
            <option value="">{t("meetup.selectLocation")}</option>
            {locations.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <label>{t("meetup.date")}</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          />

          <label>{t("meetup.time")}</label>
          <input
            required
            type="time"
            value={form.time}
            onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
          />

          {selectedLocation ? (
            <div className="selected-location-card">
              <strong>{t("meetup.selectedPoint")}</strong>
              <p>{selectedLocation.name}</p>
              <p className="muted">{selectedLocation.description || t("meetup.safePoint")}</p>
            </div>
          ) : null}

          <button className="btn btn-primary" type="submit">
            {existingMeetup ? t("meetup.updateProposal") : t("meetup.propose")}
          </button>

          {existingMeetup ? (
            <div className="meetup-action-stack">
              <button className="btn btn-secondary" type="button" onClick={confirmMeetup}>
                {t("meetup.confirm")}
              </button>
              <button className="btn btn-secondary" type="button" onClick={completeMeetup}>
                {t("meetup.complete")}
              </button>
              <button className="btn btn-danger" type="button" onClick={cancelMeetup}>
                {t("meetup.cancel")}
              </button>
            </div>
          ) : null}

          {error ? <p className="feedback error">{error}</p> : null}
          {info ? <p className="feedback success">{info}</p> : null}
        </form>
      </section>
    </AppShell>
  );
}

export default MeetupPage;
