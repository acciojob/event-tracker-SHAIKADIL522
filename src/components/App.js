import React, { useState } from "react";
import BigCalendar from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./../styles/App.css";

const localizer = BigCalendar.momentLocalizer(moment);

const PAST_COLOR = "rgb(222, 105, 135)";
const UPCOMING_COLOR = "rgb(140, 189, 76)";

// ─── Modal Component ──────────────────────────────────────────────────────────
// When modal===null this returns null → ZERO DOM nodes → overlay can NEVER block clicks
const Modal = ({ modal, onClose }) => {
  if (!modal) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="mm-popup__box"
        style={{
          background: "#fff",
          borderRadius: 6,
          padding: "24px 28px",
          minWidth: 320,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          zIndex: 9999,
        }}
      >
        <h3 style={{ margin: "0 0 12px" }}>{modal.title}</h3>
        <div>{modal.content}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <div className="mm-popup__box__footer__left-space">
            {(modal.leftButtons || []).map((btn, i) => (
              <button
                key={i}
                className={`mm-popup__btn ${btn.className || ""}`}
                onClick={() => {
                  onClose();    // unmount overlay FIRST
                  btn.action(); // then update events state
                }}
              >
                {btn.text}
              </button>
            ))}
          </div>
          <div className="mm-popup__box__footer__right-space">
            {(modal.rightButtons || []).map((btn, i) => (
              <button
                key={i}
                className={`mm-popup__btn ${btn.className || ""}`}
                onClick={() => {
                  onClose();    // unmount overlay FIRST
                  btn.action(); // then update events state
                }}
              >
                {btn.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modal, setModal]   = useState(null);

  const now = new Date();
  const isPast = (event) => moment(event.end).isBefore(now);
  const closeModal = () => setModal(null);

  const filteredEvents = events.filter((e) => {
    if (filter === "past")     return isPast(e);
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
    const pastDate  = new Date(Date.now() - 86400000 * 30);
    const slotToUse = slot || { start: pastDate, end: pastDate };

    // Plain mutable object — onChange writes into it directly, no reconciler boundary
    const formData = { title: "", location: "" };

    setModal({
      title: "Create Event",
      content: (
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
      ),
      rightButtons: [
        {
          text: "Save",
          className: "",
          action: () => {
            if (formData.title.trim()) {
              setEvents((prev) => [
                ...prev,
                {
                  id:       Date.now(),
                  title:    formData.title,
                  location: formData.location,
                  start:    slotToUse.start,
                  end:      slotToUse.end || slotToUse.start,
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

    setModal({
      title: "Edit Event",
      content: (
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
      ),
      rightButtons: [
        {
          text: "Save",
          className: "",
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

  // ── View/Edit/Delete chooser ────────────────────────────────────────────────
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
            // onClose() already ran before action(); defer to next tick
            // so setModal(null) flushes before setModal(editModal)
            setTimeout(() => openEditPopup(event), 0);
          },
        },
      ],
    });
  };

  return (
    <div>
      {/* null → no DOM nodes → overlay NEVER blocks calendar */}
      <Modal modal={modal} onClose={closeModal} />

      <div style={{ marginBottom: 16 }}>
        <button className="btn" onClick={() => openCreatePopup(null)}>Add Event</button>
        <button className="btn" onClick={() => setFilter("all")}>All</button>
        <button className="btn" onClick={() => setFilter("past")}>Past</button>
        <button className="btn" onClick={() => setFilter("upcoming")}>Upcoming</button>
      </div>

      {/* Cypress targets these by background-color style attribute */}
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
        onSelectSlot={(slotInfo) => openCreatePopup(slotInfo)}
        onSelectEvent={openEditDeletePopup}
        eventPropGetter={eventStyleGetter}
      />
    </div>
  );
};

export default App;
