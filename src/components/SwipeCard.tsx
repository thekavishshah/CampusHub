import { useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, X, User, MapPin, DollarSign, Calendar, Users } from "lucide-react";

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

interface SwipeCardProps {
  post: RoommatePost;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}

const SwipeCard = ({ post, onSwipe, isTop }: SwipeCardProps) => {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(1000);
      onSwipe('right');
    } else if (info.offset.x < -100) {
      setExitX(-1000);
      onSwipe('left');
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

  const getPostTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "looking_for_roommate":
        return "default" as const;
      case "offering_room":
        return "secondary" as const;
      case "housing_advice":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <motion.div
      className="absolute w-full"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity }}
      animate={exitX ? { x: exitX } : {}}
      onDragEnd={handleDragEnd}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card className="w-full max-w-sm mx-auto h-[600px] relative overflow-hidden shadow-xl border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Badge variant={getPostTypeBadgeVariant(post.post_type)} className="text-xs">
              {getPostTypeLabel(post.post_type)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          <CardTitle className="text-xl font-bold line-clamp-2">{post.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 pb-20">
          <p className="text-sm text-muted-foreground line-clamp-4">{post.description}</p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              <span>{post.is_anonymous ? "Anonymous" : `${post.profiles?.first_name} ${post.profiles?.last_name}`}</span>
            </div>
            
            {post.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{post.location}</span>
              </div>
            )}
            
            {post.budget_min && post.budget_max && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">
                  ${post.budget_min} - ${post.budget_max}/month
                </span>
              </div>
            )}
            
            {post.lease_duration && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{post.lease_duration}</span>
              </div>
            )}
            
            {post.gender_preference && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>{post.gender_preference}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Action buttons at bottom */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              setExitX(-1000);
              onSwipe('left');
            }}
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
            onClick={() => {
              setExitX(1000);
              onSwipe('right');
            }}
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>

        {/* Swipe indicators */}
        <motion.div
          className="absolute top-20 left-6 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-bold"
          style={{ opacity: useTransform(x, [-100, -50, 0], [1, 0, 0]) }}
        >
          PASS
        </motion.div>
        <motion.div
          className="absolute top-20 right-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold"
          style={{ opacity: useTransform(x, [0, 50, 100], [0, 0, 1]) }}
        >
          LIKE
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default SwipeCard;