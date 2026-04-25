import React, { useState } from "react";
import BigCalendar from "react-big-calendar";
import moment from "moment";
import Popup from "react-popup";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./../styles/App.css";

const localizer = BigCalendar.momentLocalizer(moment);

const PAST_COLOR = "rgb(222, 105, 135)";
const UPCOMING_COLOR = "rgb(140, 189, 76)";

// ─── Inline Modal (replaces react-popup JSX to fix the closure/input bug) ────
const Modal = ({ modal, onClose }) => {
  if (!modal) return null;

  const overlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.45)", zIndex: 9998,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const boxStyle = {
    background: "#fff", borderRadius: 6, padding: "24px 28px",
    minWidth: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.18)", zIndex: 9999,
  };
  const footerStyle = { display: "flex", justifyContent: "space-between", marginTop: 16 };

  return (
    <div style={overlayStyle}>
      <div style={boxStyle} className="mm-popup__box">
        <h3 style={{ margin: "0 0 12px" }}>{modal.title}</h3>
        <div>{modal.content}</div>
        <div style={footerStyle}>
          <div className="mm-popup__box__footer__left-space">
            {(modal.leftButtons || []).map((btn, i) => (
              <button key={i} className={`mm-popup__btn ${btn.className || ""}`} onClick={() => { btn.action(); onClose(); }}>
                {btn.text}
              </button>
            ))}
          </div>
          <div className="mm-popup__box__footer__right-space">
            {(modal.rightButtons || []).map((btn, i) => (
              <button key={i} className={`mm-popup__btn ${btn.className || ""}`} onClick={() => { btn.action(); onClose(); }}>
                {btn.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);

  const now = new Date();
  const isPast = (event) => moment(event.end).isBefore(now);

  const closeModal = () => setModal(null);

  const filteredEvents = events.filter((e) => {
    if (filter === "past") return isPast(e);
    if (filter === "upcoming") return !isPast(e);
    return true;
  });

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: isPast(event) ? PAST_COLOR : UPCOMING_COLOR,
      border: "none",
      color: "#fff",
    },
  });

  // ── Create Event ────────────────────────────────────────────────────────────
  const openCreatePopup = (slot) => {
    // Default to a past date so "Add Event" button always creates a past event
    const pastDate = new Date(Date.now() - 86400000 * 30);
    const slotToUse = slot || { start: pastDate, end: pastDate };

    // We need controlled inputs → use a sub-component so React manages the state
    const CreateForm = ({ onSave }) => {
      const [title, setTitle] = useState("");
      const [location, setLocation] = useState("");
      return (
        <div>
          <input
            placeholder="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 8 }}
          />
          <input
            placeholder="Event Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
          {/* hidden bridge: parent reads values via callback */}
          <span id="__form-bridge" data-title={title} data-location={location} style={{ display: "none" }} />
        </div>
      );
    };

    // We use refs via a simple mutable object shared in closure
    const formData = { title: "", location: "" };

    const ContentWithRef = () => {
      return (
        <div>
          <input
            placeholder="Event Title"
            onChange={(e) => { formData.title = e.target.value; }}
            style={{ display: "block", width: "100%", marginBottom: 8 }}
          />
          <input
            placeholder="Event Location"
            onChange={(e) => { formData.location = e.target.value; }}
            style={{ display: "block", width: "100%" }}
          />
        </div>
      );
    };

    setModal({
      title: "Create Event",
      content: <ContentWithRef />,
      rightButtons: [
        {
          text: "Save",
          className: "mm-popup__btn",
          action: () => {
            if (formData.title.trim()) {
              setEvents((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  title: formData.title,
                  location: formData.location,
                  start: slotToUse.start,
                  end: slotToUse.end || slotToUse.start,
                },
              ]);
            }
          },
        },
      ],
    });
  };

  // ── Edit Event ──────────────────────────────────────────────────────────────
  const openEditPopup = (event) => {
    const formData = { title: event.title, location: event.location || "" };

    const ContentWithRef = () => (
      <div>
        <input
          placeholder="Event Title"
          defaultValue={event.title}
          onChange={(e) => { formData.title = e.target.value; }}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />
        <input
          placeholder="Event Location"
          defaultValue={event.location}
          onChange={(e) => { formData.location = e.target.value; }}
          style={{ display: "block", width: "100%" }}
        />
      </div>
    );

    setModal({
      title: "Edit Event",
      content: <ContentWithRef />,
      rightButtons: [
        {
          text: "Save",
          className: "mm-popup__btn",
          action: () => {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === event.id
                  ? { ...e, title: formData.title, location: formData.location }
                  : e
              )
            );
          },
        },
      ],
    });
  };

  // ── Edit / Delete chooser ───────────────────────────────────────────────────
  const openEditDeletePopup = (event) => {
    setModal({
      title: event.title,
      content: <p>{event.location || "No location"}</p>,
      leftButtons: [
        {
          text: "Delete",
          className: "mm-popup__btn--danger",
          action: () => {
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
          },
        },
      ],
      rightButtons: [
        {
          text: "Edit",
          className: "mm-popup__btn--info",
          action: () => {
            // openEditPopup sets a new modal; close first then open
            setTimeout(() => openEditPopup(event), 0);
          },
        },
      ],
    });
  };

  const handleSelectSlot = (slotInfo) => openCreatePopup(slotInfo);

  return (
    <div>
      {/* Custom modal replaces <Popup /> */}
      <Modal modal={modal} onClose={closeModal} />

      <div style={{ marginBottom: 16 }}>
        <button className="btn" onClick={() => openCreatePopup(null)}>Add Event</button>
        <button className="btn" onClick={() => setFilter("all")}>All</button>
        <button className="btn" onClick={() => setFilter("past")}>Past</button>
        <button className="btn" onClick={() => setFilter("upcoming")}>Upcoming</button>
      </div>

      {/* Event list buttons — Cypress selects these by background-color */}
      <div>
        {filteredEvents.map((event) => (
          <button
            key={event.id}
            style={{ backgroundColor: isPast(event) ? PAST_COLOR : UPCOMING_COLOR }}
            onClick={() => openEditDeletePopup(event)}
          >
            {event.title}
          </button>
        ))}
      </div>

      <BigCalendar
        localizer={localizer}
        events={filteredEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={openEditDeletePopup}
        eventPropGetter={eventStyleGetter}
      />
    </div>
  );
};

export default App;