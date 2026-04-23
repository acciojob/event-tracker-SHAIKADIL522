import React, { useState } from "react";
import BigCalendar from "react-big-calendar";
import moment from "moment";
import Popup from "react-popup";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./../styles/App.css";

BigCalendar.setLocalizer(BigCalendar.momentLocalizer(moment));

const PAST_COLOR = "rgb(222, 105, 135)";
const UPCOMING_COLOR = "rgb(140, 189, 76)";

const App = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");

  const now = new Date();

  const isPast = (event) => moment(event.end).isBefore(now);

  const filteredEvents = events.filter((e) => {
    if (filter === "past") return isPast(e);
    if (filter === "upcoming") return !isPast(e);
    return true;
  });

  const eventStyleGetter = (event) => {
    const backgroundColor = isPast(event) ? PAST_COLOR : UPCOMING_COLOR;
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        border: "none",
        color: "#fff",
      },
    };
  };

  const openEditPopup = (event) => {
    let newTitle = event.title;
    let newLocation = event.location;

    Popup.create({
      title: "Edit Event",
      content: (
        <div>
          <input
            placeholder="Event Title"
            defaultValue={event.title}
            onChange={(e) => { newTitle = e.target.value; }}
            style={{ display: "block", width: "100%", marginBottom: 8 }}
          />
          <input
            placeholder="Event Location"
            defaultValue={event.location}
            onChange={(e) => { newLocation = e.target.value; }}
            style={{ display: "block", width: "100%" }}
          />
        </div>
      ),
      buttons: {
        right: [
          {
            text: "Save",
            className: "mm-popup__btn",
            action: () => {
              setEvents((prev) =>
                prev.map((e) =>
                  e.id === event.id
                    ? { ...e, title: newTitle, location: newLocation }
                    : e
                )
              );
              Popup.close();
            },
          },
        ],
      },
    });
  };

  const openEditDeletePopup = (event) => {
    Popup.create({
      title: event.title,
      content: <p>{event.location || "No location"}</p>,
      buttons: {
        left: [
          {
            text: "Delete",
            className: "mm-popup__btn mm-popup__btn--danger",
            action: () => {
              setEvents((prev) => prev.filter((e) => e.id !== event.id));
              Popup.close();
            },
          },
        ],
        right: [
          {
            text: "Edit",
            className: "mm-popup__btn mm-popup__btn--info",
            action: () => {
              Popup.close();
              openEditPopup(event);
            },
          },
        ],
      },
    });
  };

  const openCreatePopup = (slotInfo) => {
    let title = "";
    let location = "";

    Popup.create({
      title: "Create Event",
      content: (
        <div>
          <input
            placeholder="Event Title"
            onChange={(e) => { title = e.target.value; }}
            style={{ display: "block", width: "100%", marginBottom: 8 }}
          />
          <input
            placeholder="Event Location"
            onChange={(e) => { location = e.target.value; }}
            style={{ display: "block", width: "100%" }}
          />
        </div>
      ),
      buttons: {
        right: [
          {
            text: "Save",
            className: "mm-popup__btn",
            action: () => {
              if (title.trim()) {
                setEvents((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    title,
                    location,
                    start: slotInfo.start,
                    end: slotInfo.end || slotInfo.start,
                  },
                ]);
              }
              Popup.close();
            },
          },
        ],
      },
    });
  };

  return (
    <div>
      <Popup />
      <div style={{ marginBottom: 16 }}>
        <button className="btn" onClick={() => setFilter("all")}>All</button>
        <button className="btn" onClick={() => setFilter("past")}>Past</button>
        <button className="btn" onClick={() => setFilter("upcoming")}>Upcoming</button>
      </div>
      <BigCalendar
        events={filteredEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        selectable
        onSelectSlot={openCreatePopup}
        onSelectEvent={openEditDeletePopup}
        eventPropGetter={eventStyleGetter}
      />
    </div>
  );
};

export default App;