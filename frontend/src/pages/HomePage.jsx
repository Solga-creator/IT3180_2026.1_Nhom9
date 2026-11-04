import { useAuth } from "../contexts/useAuth.js";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <section>
      <h1>Màn hình chính</h1>
      <p>
        Xin chào <strong>{user.fullName}</strong>.
      </p>
    </section>
  );
}
