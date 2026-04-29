import React, { useState } from "react";
import BigCalendar from "react-big-calendar";
import moment from "moment";
import Popup from "react-popup";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./../styles/App.css";

const localizer = BigCalendar.momentLocalizer(moment);

const PAST_COLOR   = "rgb(222, 105, 135)";
const UPCOMING_COLOR = "rgb(140, 189, 76)";

const App = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");

  const now = new Date();
  const isPast = (event) => moment(event.end).isBefore(now);

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

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreatePopup = (slot) => {
    const pastDate  = new Date(Date.now() - 86400000 * 30);
    const slotToUse = slot || { start: pastDate, end: pastDate };
    const formData  = { title: "", location: "" };

    Popup.create({
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
      buttons: {
        right: [{
          text: "Save",
          action: () => {
            if (formData.title.trim()) {
              setEvents((prev) => [...prev, {
                id:       Date.now(),
                title:    formData.title,
                location: formData.location,
                start:    slotToUse.start,
                end:      slotToUse.end || slotToUse.start,
              }]);
            }
            Popup.close();
          },
        }],
      },
    });
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEditPopup = (event) => {
    const formData = { title: event.title, location: event.location || "" };

    Popup.create({
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
      buttons: {
        right: [{
          text: "Save",
          action: () => {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === event.id
                  ? { ...e, title: formData.title, location: formData.location }
                  : e
              )
            );
            Popup.close();
          },
        }],
      },
    });
  };

  // ── View / Edit / Delete ──────────────────────────────────────────────────
  const openEditDeletePopup = (event) => {
    Popup.create({
      title: event.title,
      content: <p>{event.location || "No location"}</p>,
      buttons: {
        left: [{
          text: "Delete",
          className: "mm-popup__btn--danger",
          action: () => {
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
            Popup.close();
          },
        }],
        right: [{
          text: "Edit",
          className: "mm-popup__btn--info",
          action: () => {
            Popup.close();
            setTimeout(() => openEditPopup(event), 50);
          },
        }],
      },
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="btn" onClick={() => openCreatePopup(null)}>Add Event</button>
        <button className="btn" onClick={() => setFilter("all")}>All</button>
        <button className="btn" onClick={() => setFilter("past")}>Past</button>
        <button className="btn" onClick={() => setFilter("upcoming")}>Upcoming</button>
      </div>

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