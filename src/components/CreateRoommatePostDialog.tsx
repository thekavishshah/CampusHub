import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CreateRoommatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

const CreateRoommatePostDialog = ({ open, onOpenChange, onPostCreated }: CreateRoommatePostDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    post_type: "",
    budget_min: "",
    budget_max: "",
    location: "",
    gender_preference: "",
    lease_duration: "",
    is_anonymous: false,
  });

  const postTypes = [
    { value: "looking_for_roommate", label: "Looking for Roommate" },
    { value: "offering_room", label: "Offering Room" },
    { value: "housing_advice", label: "Housing Advice" },
  ];

  const genderPreferences = ["Any", "Male", "Female", "Non-binary"];
  const leaseDurations = ["Semester", "Academic Year", "Summer", "1-6 months", "6-12 months", "12+ months"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.log("No user found");
      return;
    }

    console.log("Form data:", formData);
    console.log("User:", user);
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("roommate_posts")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          post_type: formData.post_type,
          budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
          location: formData.location,
          gender_preference: formData.gender_preference,
          lease_duration: formData.lease_duration,
          is_anonymous: formData.is_anonymous,
        });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast({
        title: "Post Created",
        description: "Your roommate post has been successfully created",
      });

      setFormData({
        title: "",
        description: "",
        post_type: "",
        budget_min: "",
        budget_max: "",
        location: "",
        gender_preference: "",
        lease_duration: "",
        is_anonymous: false,
      });
      
      onPostCreated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Roommate Post</DialogTitle>
          <DialogDescription>
            Create a post to find roommates or offer housing advice
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post_type">Post Type *</Label>
            <Select
              value={formData.post_type}
              onValueChange={(value) => setFormData({ ...formData, post_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Looking for roommate for Spring 2024"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you're looking for, your preferences, lifestyle, etc."
              className="min-h-[100px]"
              required
            />
          </div>
          
          {formData.post_type !== "housing_advice" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">Min Budget ($)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  min="0"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                  placeholder="500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget_max">Max Budget ($)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  min="0"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Near Tempe Campus, Downtown Phoenix"
            />
          </div>
          
          {formData.post_type !== "housing_advice" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gender_preference">Gender Preference</Label>
                <Select
                  value={formData.gender_preference}
                  onValueChange={(value) => setFormData({ ...formData, gender_preference: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderPreferences.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lease_duration">Lease Duration</Label>
                <Select
                  value={formData.lease_duration}
                  onValueChange={(value) => setFormData({ ...formData, lease_duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaseDurations.map((duration) => (
                      <SelectItem key={duration} value={duration}>
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_anonymous: checked as boolean })
              }
            />
            <Label htmlFor="is_anonymous" className="text-sm">
              Post anonymously
            </Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoommatePostDialog;