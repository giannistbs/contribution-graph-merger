import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, GitMerge, Loader2, Github, Sun, Moon, Link } from "lucide-react";
import darkLogo from "../../logos/dark.png";
import lightLogo from "../../logos/light.png";
import { useTheme } from "@/hooks/use-theme";
import type { MergedContributions } from "@shared/schema";
import ContributionGraph from "@/components/contribution-graph";

export default function Home() {
  const [usernames, setUsernames] = useState<string[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.getAll("u").slice(0, 4);
    return fromUrl.length > 0 ? fromUrl : [""];
  });
  const { toast } = useToast();
  const { theme, toggle } = useTheme();

  const mutation = useMutation({
    mutationFn: async (names: string[]) => {
      const res = await apiRequest("POST", "/api/contributions", {
        usernames: names.filter((n) => n.trim()),
      });
      return res.json() as Promise<{
        data: MergedContributions;
        errors?: { username: string; error: string }[];
      }>;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some profiles could not be loaded",
          description: data.errors.map((e) => `${e.username}: ${e.error}`).join(", "),
        });
      }
    },
  });

  const addUsername = () => {
    if (usernames.length < 4) {
      setUsernames([...usernames, ""]);
    }
  };

  const removeUsername = (index: number) => {
    if (usernames.length > 1) {
      setUsernames(usernames.filter((_, i) => i !== index));
    }
  };

  const updateUsername = (index: number, value: string) => {
    const updated = [...usernames];
    updated[index] = value;
    setUsernames(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validNames = usernames.filter((n) => n.trim());
    if (validNames.length === 0) {
      toast({
        title: "No usernames",
        description: "Enter at least one GitHub username.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(validNames);
  };

  // Auto-submit when usernames were pre-filled from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.getAll("u").slice(0, 4).filter((u) => u.trim());
    if (fromUrl.length > 0) {
      mutation.mutate(fromUrl);
    }
  }, []);

  const copyShareLink = () => {
    const valid = usernames.filter((n) => n.trim());
    if (valid.length === 0) return;
    const params = new URLSearchParams();
    valid.forEach((u) => params.append("u", u.trim()));
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied!", description: url });
    });
  };

  const userColors = ["#2f81f7", "#da3633", "#f0883e", "#8957e5"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1012px] mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img
              src={theme === "dark" ? darkLogo : lightLogo}
              alt="Contributions Merger"
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Contributions Merger
            </h1>
          </div>
          <div className="flex items-center gap-1">
          <a
            href="https://github.com/giannistbs/contribution-graph-merger"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
          >
            <Github className="w-3.5 h-3.5" />
            Star on GitHub
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-8 ml-11">
          Combine up to 4 GitHub profiles into a single contribution graph.
        </p>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="mb-10" autoComplete="off">
          <div className="glass-card rounded-md border border-border bg-card p-4">
            <div className="flex flex-col gap-3">
              {usernames.map((username, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: userColors[index] }}
                  />
                  <div
                    className="relative flex-1 rounded-md"
                    style={theme === "dark" ? { boxShadow: `0 0 0 1px ${userColors[index]}40, 0 0 12px ${userColors[index]}18` } : undefined}
                  >
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      data-testid={`input-username-${index}`}
                      type="text"
                      name={`github-handle-${index}`}
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      data-1p-ignore
                      placeholder={
                        ["First", "Second", "Third", "Fourth"][index] + " GitHub username"
                      }
                      value={username}
                      onChange={(e) => updateUsername(index, e.target.value)}
                      className="pl-9 bg-background border-border h-9 text-sm font-mono"
                    />
                  </div>
                  {usernames.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUsername(index)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      data-testid={`button-remove-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              {usernames.length < 4 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addUsername}
                  className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
                  data-testid="button-add-username"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add profile
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Maximum 4 profiles
                </span>
              )}
              <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyShareLink}
                className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
                title="Copy shareable link"
              >
                <Link className="w-3.5 h-3.5" />
                Share
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutation.isPending}
                className="btn-gradient-green text-white gap-1.5 text-xs"
                data-testid="button-generate"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <GitMerge className="w-3.5 h-3.5" />
                )}
                {mutation.isPending ? "Fetching..." : usernames.filter((n) => n.trim()).length <= 1 ? "Show contributions" : "Merge contributions"}
              </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Results */}
        {mutation.data?.data && (
          <ContributionGraph data={mutation.data.data} />
        )}
      </div>
    </div>
  );
}