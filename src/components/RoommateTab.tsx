import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, Users, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import CreateRoommatePostDialog from "@/components/CreateRoommatePostDialog";
import SwipeCard from "@/components/SwipeCard";
import MatchesView from "@/components/MatchesView";

interface RoommatePost {
  id: string;
  user_id: string;
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentView, setCurrentView] = useState<'swipe' | 'matches'>('swipe');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedPosts, setSwipedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    if (!user) return;
    
    try {
      // Get posts that user hasn't swiped on yet
      const { data: swipedData } = await supabase
        .from("swipes")
        .select("swiped_user_id, roommate_post_id")
        .eq("user_id", user.id);

      const swipedPostIds = new Set(swipedData?.map(s => s.roommate_post_id) || []);
      setSwipedPosts(swipedPostIds);

      const { data, error } = await supabase
        .from("roommate_posts")
        .select(`
          *,
          profiles (first_name, last_name, email)
        `)
        .neq("user_id", user.id) // Don't show user's own posts
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter out already swiped posts
      const unswipedPosts = (data || []).filter(post => !swipedPostIds.has(post.id));
      setPosts(unswipedPosts as unknown as RoommatePost[]);
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

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || currentIndex >= posts.length) return;

    const currentPost = posts[currentIndex];
    const isLike = direction === 'right';

    try {
      // Record the swipe
      const { error: swipeError } = await supabase
        .from("swipes")
        .insert({
          user_id: user.id,
          swiped_user_id: currentPost.user_id,
          roommate_post_id: currentPost.id,
          is_like: isLike,
        });

      if (swipeError) throw swipeError;

      // If it's a like, check if there's a mutual like to create a match
      if (isLike) {
        const { data: mutualSwipe } = await supabase
          .from("swipes")
          .select("*")
          .eq("user_id", currentPost.user_id)
          .eq("swiped_user_id", user.id)
          .eq("roommate_post_id", currentPost.id)
          .eq("is_like", true)
          .single();

        if (mutualSwipe) {
          // Create a match
          const { error: matchError } = await supabase
            .from("matches")
            .insert({
              user_id: user.id,
              matched_user_id: currentPost.user_id,
              roommate_post_id: currentPost.id,
            });

          if (!matchError) {
            toast({
              title: "It's a Match! 🎉",
              description: `You and ${currentPost.profiles?.first_name} both liked each other!`,
            });
          }
        }
      }

      // Move to next post
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record swipe",
        variant: "destructive",
      });
    }
  };

  // Show matches view
  if (currentView === 'matches') {
    return <MatchesView onBack={() => setCurrentView('swipe')} />;
  }

  if (loading) {
    return <div className="text-center py-8">Loading roommate posts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Roommate Finder</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentView('matches')}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            Matches
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Swipe Interface */}
      <div className="flex flex-col items-center space-y-6">
        {loading ? (
          <div className="text-center py-8">Loading potential roommates...</div>
        ) : currentIndex >= posts.length ? (
          <div className="text-center py-12 space-y-4">
            <Users className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-xl font-semibold mb-2">No more posts!</h3>
              <p className="text-muted-foreground">You've seen all available roommate posts.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back later for new posts or create your own!</p>
            </div>
            <Button onClick={() => {
              setCurrentIndex(0);
              fetchPosts();
            }}>
              Refresh Posts
            </Button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm mx-auto h-[600px]">
            {/* Show current and next card */}
            {posts.slice(currentIndex, currentIndex + 2).map((post, index) => (
              <SwipeCard
                key={post.id}
                post={post}
                onSwipe={handleSwipe}
                isTop={index === 0}
              />
            ))}
          </div>
        )}

        {/* Progress indicator */}
        {posts.length > 0 && currentIndex < posts.length && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{currentIndex + 1} of {posts.length}</span>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / posts.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <CreateRoommatePostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPostCreated={fetchPosts}
      />
    </div>
  );
};

export default RoommateTab;