import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import axios from "axios";
import moment from "moment-timezone";

const ActiveFlights = () => {
  const [flights, setFlights] = useState([]);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const response = await axios.get("https://lambda.sayintentions.ai/mods/activeFlights");
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
      flight.tail_number?.toLowerCase().includes(query)
    );
  });

  const getMessageAge = (stamp) => {
    // stamp looks like zulu time, but it's really in Denver time, so let's convert to utc
    const denverTime = moment(stamp, "YYYY-MM-DDTHH:mm:ss.SSS");
    const correctDenverTime = denverTime.tz("America/Denver", true);

    // let's get the current time in UTC
    const now = moment().utc();

    const ageInSeconds = Math.floor((now - correctDenverTime) / 1000);
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
        {filteredFlights
          .sort((flightA, flightB) => flightA.id - flightB.id)
          .map((flight) => (
            <div
              key={flight.id}
              className="flight-tile"
              style={{ backgroundColor: getColorForAge(getMessageAge(flight.stamp)) }}
            >
              <div className="age">Age: {getMessageAge(flight.stamp)} seconds</div>
              <div className="debugs">{flight.debugs > 0 ? <> {flight.debugs} debugs logged </> : ""}</div>
              <p className="flightRules">{flight.flight_rules}</p>
              {flight.tail_number ? <h2>{flight.tail_number}</h2> : <h2 className="alert">No tail number</h2>}
              {flight.displayname ? <p>Name: {flight.displayname}</p> : <p className="alert">No display name</p>}
              <p>Flight ID: {flight.flight_id}</p>
              <p>
                Airspeed: {flight.airspeed} Altitude: {flight.altitude}
              </p>
              <Link to={`/flight-history/${flight.flight_id}`}>View Details</Link>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ActiveFlights;
