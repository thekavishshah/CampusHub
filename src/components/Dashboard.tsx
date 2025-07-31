import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, Users, LogOut } from "lucide-react";
import MarketplaceTab from "@/components/MarketplaceTab";
import RoommateTab from "@/components/RoommateTab";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("marketplace");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">ASU CampusHub</h1>
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.first_name || user?.email}
            </span>
          </div>
          <Button variant="outline" onClick={signOut} size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="roommates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Roommate Finder
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="marketplace" className="mt-6">
            <MarketplaceTab />
          </TabsContent>
          
          <TabsContent value="roommates" className="mt-6">
            <RoommateTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;