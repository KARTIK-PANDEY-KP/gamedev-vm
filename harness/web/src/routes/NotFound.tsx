import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <EmptyState
        icon="alert"
        title="No such page"
        body="That URL does not match any view in the harness. The projects list is the way in."
        action={
          <Button variant="primary" icon="back" onClick={() => void navigate("/")}>
            Back to projects
          </Button>
        }
      />
    </div>
  );
}
