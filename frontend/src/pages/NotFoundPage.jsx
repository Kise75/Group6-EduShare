import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";

function NotFoundPage() {
  return (
    <AppShell>
      <div className="empty-block">
        <h1>Page Not Found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link className="btn btn-primary" to="/">
          Go to Marketplace
        </Link>
      </div>
    </AppShell>
  );
}

export default NotFoundPage;
