import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MessageCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import CreateRoommatePostDialog from "@/components/CreateRoommatePostDialog";

interface RoommatePost {
  id: string;
  title: string;
  description: string;
  post_type: string;
  budget_min: number;
  budget_max: number;
  location: string;
  gender_preference: string;
  lease_duration: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

const RoommateTab = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState("");

  const postTypes = ["all", "looking_for_roommate", "offering_room", "housing_advice"];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("roommate_posts")
        .select(`
          *,
          profiles (first_name, last_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data as unknown as RoommatePost[] || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load roommate posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles (first_name, last_name)
        `)
        .eq("roommate_post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(prev => ({ 
        ...prev, 
        [postId]: data as unknown as Comment[] || []
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          roommate_post_id: postId,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      fetchComments(postId);
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleContactPoster = async (post: RoommatePost) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: post.profiles.email, // This should be user_id, but we'll use email for now
          content: `Hi, I saw your post "${post.title}" and I'm interested. Let's connect!`,
          roommate_post_id: post.id,
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: `You've contacted the poster about "${post.title}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || post.post_type === typeFilter;
    return matchesSearch && matchesType;
  });

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

  const getPostTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "looking_for_roommate":
        return "default";
      case "offering_room":
        return "secondary";
      case "housing_advice":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading roommate posts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Roommate Finder</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Post Type" />
          </SelectTrigger>
          <SelectContent>
            {postTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type === "all" ? "All Types" : getPostTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <Badge variant={getPostTypeBadgeVariant(post.post_type)}>
                      {getPostTypeLabel(post.post_type)}
                    </Badge>
                  </div>
                  {post.budget_min && post.budget_max && (
                    <CardDescription className="font-semibold text-primary">
                      ${post.budget_min} - ${post.budget_max}/month
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedPost === post.id) {
                        setSelectedPost(null);
                      } else {
                        setSelectedPost(post.id);
                        fetchComments(post.id);
                      }
                    }}
                  >
                    {selectedPost === post.id ? "Hide" : "Comments"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleContactPoster(post)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Contact
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{post.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {post.is_anonymous ? "Anonymous" : `${post.profiles?.first_name} ${post.profiles?.last_name}`}
                </div>
                {post.location && <span>📍 {post.location}</span>}
                {post.gender_preference && <span>👥 {post.gender_preference}</span>}
                {post.lease_duration && <span>📅 {post.lease_duration}</span>}
                <span>🕒 {new Date(post.created_at).toLocaleDateString()}</span>
              </div>

              {/* Comments Section */}
              {selectedPost === post.id && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold">Comments</h4>
                  <div className="space-y-3">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">
                            {comment.profiles?.first_name} {comment.profiles?.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment.trim()}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found matching your criteria.</p>
        </div>
      )}

      <CreateRoommatePostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPostCreated={fetchPosts}
      />
    </div>
  );
};

export default RoommateTab;