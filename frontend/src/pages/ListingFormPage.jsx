import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import PriceSuggestionCard from "../components/PriceSuggestionCard";
import api, { parseApiError } from "../services/api";

const initialForm = {
  title: "",
  description: "",
  courseCode: "",
  category: "Textbooks",
  condition: "Good",
  price: "",
  edition: "",
  isbn: "",
  campusLocation: "Campus Library",
  status: "Active",
};

function ListingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canSelectReservedStatus = isEdit && form.status === "Reserved";

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [locationResponse, listingResponse] = await Promise.all([
          api.get("/meetups/campus-locations"),
          isEdit ? api.get(`/listings/${id}`) : Promise.resolve(null),
        ]);

        const nextLocations = locationResponse.data || [];
        setLocations(nextLocations);

        if (listingResponse) {
          const listing = listingResponse.data;
          setForm({
            title: listing.title || "",
            description: listing.description || "",
            courseCode: listing.courseCode || "",
            category: listing.category || "Textbooks",
            condition: listing.condition || "Good",
            price: listing.price || "",
            edition: listing.edition || "",
            isbn: listing.isbn || "",
            campusLocation: listing.campusLocation?.name || nextLocations[0]?.name || "Campus Library",
            status: listing.status || "Active",
          });
          return;
        }

        if (nextLocations[0]?.name) {
          setForm((prev) => ({ ...prev, campusLocation: nextLocations[0].name }));
        }
      } catch (requestError) {
        setError(parseApiError(requestError, "Cannot load listing form"));
      }
    };

    fetchInitialData();
  }, [id, isEdit]);

  useEffect(() => {
    const shouldSuggest = form.title || form.courseCode || form.category || form.condition || form.edition;
    if (!shouldSuggest) {
      setSuggestion(null);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setSuggestionLoading(true);
      setSuggestionError("");
      try {
        const response = await api.post("/pricing/suggest", {
          title: form.title,
          category: form.category,
          condition: form.condition,
          courseCode: form.courseCode,
          edition: form.edition,
        });
        setSuggestion(response.data);
      } catch (requestError) {
        setSuggestionError(parseApiError(requestError, "Cannot get smart price suggestion"));
      } finally {
        setSuggestionLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form.title, form.category, form.condition, form.courseCode, form.edition]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplySuggestedPrice = (value) => {
    handleChange("price", String(value || ""));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (isEdit) {
        await api.put(`/listings/${id}`, form);
      } else {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          formData.append(key, value);
        });
        images.forEach((image) => formData.append("images", image));
        await api.post("/listings", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate("/profile");
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot save listing"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <section className="section-head">
        <div>
          <h1>{isEdit ? "Edit Listing" : "Create Listing"}</h1>
          <p className="muted">Fill in the details once and let the system suggest pricing and safer meetup defaults.</p>
        </div>
      </section>

      <div className="step-head">
        <span className="active">1. Listing Details</span>
        <span>2. Smart Pricing</span>
        <span>3. Meetup Preferences</span>
      </div>

      <section className="form-with-sidebar">
        <form className="form-stack panel-card" onSubmit={handleSubmit}>
          <label>Title</label>
          <input
            required
            value={form.title}
            onChange={(event) => handleChange("title", event.target.value)}
            placeholder="e.g. Calculus Textbook for Sale"
          />

          <label>Description</label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(event) => handleChange("description", event.target.value)}
            placeholder="Describe condition, included notes, and meetup preference."
          />

          <div className="inline-two">
            <div>
              <label>Course Code</label>
              <input
                value={form.courseCode}
                onChange={(event) => handleChange("courseCode", event.target.value.toUpperCase())}
                placeholder="e.g. MATH101"
              />
            </div>
            <div>
              <label>Category</label>
              <select value={form.category} onChange={(event) => handleChange("category", event.target.value)}>
                <option value="Textbooks">Textbooks</option>
                <option value="Lab Kits">Lab Kits</option>
                <option value="Notes">Notes</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="inline-two">
            <div>
              <label>Condition</label>
              <select value={form.condition} onChange={(event) => handleChange("condition", event.target.value)}>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div>
              <label>Price (VND)</label>
              <input
                required
                type="number"
                min="1000"
                step="1000"
                value={form.price}
                onChange={(event) => handleChange("price", event.target.value)}
                placeholder="e.g. 120000"
              />
            </div>
          </div>

          <p className="field-hint">
            Suggested student range is usually 40.000 - 250.000 VND depending on condition, course demand, and edition.
          </p>

          <div className="inline-two">
            <div>
              <label>Edition</label>
              <input
                value={form.edition}
                onChange={(event) => handleChange("edition", event.target.value)}
                placeholder="8th Edition"
              />
            </div>
            <div>
              <label>ISBN</label>
              <input
                value={form.isbn}
                onChange={(event) => handleChange("isbn", event.target.value)}
                placeholder="978-0-321-78900-0"
              />
            </div>
          </div>

          <label>Preferred Campus Meetup Spot</label>
          <select value={form.campusLocation} onChange={(event) => handleChange("campusLocation", event.target.value)}>
            {locations.map((location) => (
              <option key={location.id} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>

          {isEdit ? (
            <>
              <label>Listing Status</label>
              <select value={form.status} onChange={(event) => handleChange("status", event.target.value)}>
                <option value="Active">Available</option>
                {canSelectReservedStatus ? <option value="Reserved">Reserved</option> : null}
                <option value="Sold">Sold</option>
              </select>
              {!canSelectReservedStatus ? (
                <p className="field-hint">
                  Reserved state is controlled by the buyer reservation flow and meetup workflow.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <label>Images (optional)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => setImages(Array.from(event.target.files || []))}
              />
            </>
          )}

          {error ? <p className="feedback error">{error}</p> : null}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : isEdit ? "Update Listing" : "Create Listing"}
          </button>
        </form>

        <aside className="form-sidebar">
          <PriceSuggestionCard
            suggestion={suggestion}
            loading={suggestionLoading}
            error={suggestionError}
            currentPrice={form.price}
            onApplyPrice={handleApplySuggestedPrice}
          />
          <div className="panel-card">
            <h3>Why this matters</h3>
            <p>
              Better pricing attracts more buyers, while a preferred campus meetup spot improves recommendation quality and safer transaction planning.
            </p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

export default ListingFormPage;
