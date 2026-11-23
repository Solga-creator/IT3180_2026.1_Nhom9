import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../contexts/useAuth.js";

export default function ResidentHomePage() {
  const { user } = useAuth();
  const [residence, setResidence] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/auth/residence")
      .then((data) => {
        if (active) setResidence(data.residence);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section>
      <h1>Màn hình chính</h1>
      <p>
        Xin chào <strong>{residence?.fullName || user.fullName}</strong>.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {residence && (
        <p>
          Căn hộ <strong>{residence.roomNumber}</strong>
          {" · "}
          {residence.relationship}
        </p>
      )}
    </section>
  );
}
