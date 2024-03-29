import React, { useEffect, useState } from "react";

import axios from "axios";
import moment from "moment-timezone";

const ActiveFlights = () => {
  const [flights, setFlights] = useState([]);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFlights = async () => {
      const authToken = localStorage.getItem("authToken");
      try {
        const response = await axios.get("https://lambda.sayintentions.ai/mods/activeFlights", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setFlights(response.data);
      } catch (error) {
        console.error("Error fetching active flights:", error);
      }
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set up an interval to update the currentSecond state every second
    const secondInterval = setInterval(() => {
      setCurrentSecond((prevSecond) => prevSecond + 1);
    }, 1000);

    return () => clearInterval(secondInterval);
  }, []);

  const filteredFlights = flights.filter((flight) => {
    const query = searchQuery.toLowerCase();
    return (
      flight.flight_id?.toString().toLowerCase().includes(query) ||
      flight.user_id?.toString().toLowerCase().includes(query) ||
      flight.displayname?.toLowerCase().includes(query) ||
      flight.callsign?.toLowerCase().includes(query) ||
      flight.discord_handle?.toLowerCase().includes(query) ||
      String(flight.latest_xpdr)?.toLowerCase().includes(query) ||
      flight.tail_number?.toLowerCase().includes(query)
    );
  });

  const getMessageAge = (stamp) => {
    // stamp comes back like this: 2024-03-11T07:16:40.000Z
    // however, while this looks like a zulu time, it's actually 7 hours off, so let's fix the stamp
    const fixedStampString = stamp.replace("Z", "-07:00");
    const fixedStamp = moment(fixedStampString);

    const now = moment().utc();

    const ageInSeconds = Math.floor((now - fixedStamp) / 1000);
    return ageInSeconds;
  };

  const getColorForAge = (ageInSeconds) => {
    const fullGrayTime = 600; // 10 minutes
    if (ageInSeconds < 60) {
      return "#FFFFFF"; // White for less than a minute old
    } else if (ageInSeconds >= fullGrayTime) {
      return "#444444"; // Dark gray for 10 minutes and older
    } else {
      // Calculate a gradient between white and #444444 based on the age
      const gradientFactor = (ageInSeconds - 60) / (fullGrayTime - 60); // Normalize between 0 and 1
      // Convert to a scale of 255 to 68 (where #444444 in decimal is RGB(68, 68, 68))
      const colorValue = Math.round(255 - gradientFactor * (255 - 68));
      // Ensure the value is in hexadecimal format and return the color
      const hexValue = colorValue.toString(16).padStart(2, "0");
      return `#${hexValue}${hexValue}${hexValue}`;
    }
  };

  const calculateFlightTime = (flight) => {
    if (!flight.min_history_stamp) {
      return "No history";
    }

    const historyTime = getMessageAge(flight.min_history_stamp);
    const stampTime = getMessageAge(flight.stamp);
    const diff = historyTime - stampTime;

    // convert to HHMMSS
    return moment.utc(diff * 1000).format("HH:mm:ss");
  };

  const calculateXpdrColor = (flight) => {
    if (flight.clearance_xpdr && flight.clearance_xpdr !== 0 && flight.latest_xpdr === flight.clearance_xpdr) {
      return "xpdrMatch";
    }
    if ((flight.latest_xpdr === 7000 || flight.latest_xpdr === 1200) && flight.latest_xpdr_setting === "Alt") {
      return "xpdrVfr";
    }
    return "xpdrNoMatch";
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search flights..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ margin: "20px 0", padding: "10px", width: "400px" }}
      />

      <div className="active-flights-container">
        {filteredFlights.map((flight) => (
          <div
            key={flight.flight_id}
            className="flight-tile"
            style={{ backgroundColor: getColorForAge(getMessageAge(flight.stamp)) }}
          >
            <div className="flightTime">{calculateFlightTime(flight)}</div>
            <div className="debugs">{flight.debugs > 0 ? <> {flight.debugs} debugs logged </> : ""}</div>
            <p className="flightRules">{flight.flight_rules}</p>
            {flight.tail_number ? <h2>{flight.tail_number}</h2> : <h2 className="alert">No tail number</h2>}
            <p>
              <span className={calculateXpdrColor(flight)}>
                XPDR: {flight.latest_xpdr ? String(flight.latest_xpdr).padStart(4, "0") : "----"} (
                {flight.latest_xpdr_setting ? flight.latest_xpdr_setting : "---"})
              </span>
              {flight.latest_xpdr && flight.latest_xpdr !== 0 ? (
                <>
                  <br />
                  <span>
                    {flight.clearance_xpdr && flight.clearance_xpdr !== 0 ? (
                      <span className={flight.clearance_xpdr === flight.latest_xpdr ? "xpdrMatch" : "xpdrNoMatch"}>
                        Given: {flight.clearance_xpdr}
                      </span>
                    ) : null}
                  </span>
                </>
              ) : null}
            </p>
            <div className="names">
              {flight.displayname && flight.displayname !== "none" ? (
                <span>Name: {flight.displayname}</span>
              ) : (
                <span className="alert">No display name</span>
              )}
              <br />
              {flight.callsign ? <span>Callsign: {flight.callsign}</span> : null}
              <br />
              {flight.discord_handle ? <span>Discord: {flight.discord_handle}</span> : null}
            </div>
            <p>
              Flight ID: {flight.flight_id}
              <br />
              User ID:{" "}
              <a
                href={`https://portal.sayintentions.ai/portal/admin/accounts/edit.html?userid=${flight.userid}`}
                target="_blank"
                rel="noreferrer"
              >
                {flight.userid}
              </a>
            </p>
            <a
              href={`https://portal.sayintentions.ai/portal/flights/flight.html?flight_id=${flight.flight_id}`}
              target="_blank"
              rel="noreferrer"
            >
              Flight Map
            </a>
            &nbsp;
            <a
              href={`https://portal.sayintentions.ai/portal/flights/flight2.html?flight_id=${flight.flight_id}`}
              target="_blank"
              rel="noreferrer"
            >
              (2)
            </a>
            <br />
            <a
              href={`https://portal.sayintentions.ai/portal/flights/history.html?flight_id=${flight.flight_id}`}
              target="_blank"
              rel="noreferrer"
            >
              Flight Transcript
            </a>
            <br />
            <a
              href={`https://www.sayintentions.ai/tracker?flightId=${flight.flight_id}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Tracker
            </a>
            <p>
              Airspeed: {flight.airspeed} Altitude: {flight.altitude}
            </p>
            <div className="age">Age: {getMessageAge(flight.stamp)} seconds</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveFlights;
