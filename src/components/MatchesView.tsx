import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User, MapPin, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Match {
  id: string;
  matched_user_id: string;
  roommate_post_id: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  roommate_posts: {
    id: string;
    title: string;
    description: string;
    post_type: string;
    budget_min: number;
    budget_max: number;
    location: string;
    is_anonymous: boolean;
  };
}

interface MatchesViewProps {
  onBack: () => void;
}

const MatchesView = ({ onBack }: MatchesViewProps) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          profiles!matches_matched_user_id_fkey (first_name, last_name, email),
          roommate_posts (id, title, description, post_type, budget_min, budget_max, location, is_anonymous)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMatches(data as unknown as Match[] || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (matchedUserId: string, postId: string) => {
    if (!user || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: matchedUserId,
          content: newMessage.trim(),
          roommate_post_id: postId,
        });

      if (error) throw error;

      setNewMessage("");
      setSelectedMatch(null);
      toast({
        title: "Message Sent",
        description: "Your message has been sent to your match!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case "looking_for_roommate":
        return "Looking for Roommate";
      case "offering_room":
        return "Offering Room";
      case "housing_advice":
        return "Housing Advice";
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading matches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Matches</h2>
        <Button variant="outline" onClick={onBack}>
          Back to Swipe
        </Button>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No matches yet. Keep swiping to find your perfect roommate!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{match.roommate_posts.title}</CardTitle>
                      <Badge variant="secondary">
                        {getPostTypeLabel(match.roommate_posts.post_type)}
                      </Badge>
                    </div>
                    {match.roommate_posts.budget_min && match.roommate_posts.budget_max && (
                      <CardDescription className="font-semibold text-primary">
                        ${match.roommate_posts.budget_min} - ${match.roommate_posts.budget_max}/month
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedMatch(selectedMatch === match.id ? null : match.id)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Message
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{match.roommate_posts.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {match.roommate_posts.is_anonymous ? "Anonymous" : `${match.profiles.first_name} ${match.profiles.last_name}`}
                  </div>
                  {match.roommate_posts.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {match.roommate_posts.location}
                    </div>
                  )}
                  <span>💝 Matched {new Date(match.created_at).toLocaleDateString()}</span>
                </div>

                {/* Message Section */}
                {selectedMatch === match.id && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold">Send a message</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Hey! I saw your post and I'm interested..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleSendMessage(match.matched_user_id, match.roommate_post_id)}
                        disabled={!newMessage.trim()}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesView;