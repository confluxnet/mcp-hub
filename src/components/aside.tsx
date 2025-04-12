import { Button } from "@/components/ui/button";
import { BarChart2, Package, Users, Wallet } from "lucide-react";

interface AsideProps {
  isSidebarOpen: boolean;
  setActiveTab: (tab: "usage" | "provide" | "dao") => void;
  account: string;
  balance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

export function Aside({
  isSidebarOpen,
  setActiveTab,
  account,
  balance,
  connectWallet,
  disconnectWallet,
}: AsideProps) {
  return (
    <aside
      className={`
        fixed
        top-16
        left-0
        h-[calc(100vh-4rem)]
        w-64
        bg-background
        border-r
        transition-transform
        duration-300
        ease-in-out
        z-30
        flex
        flex-col
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="p-4">
        <h1 className="text-xl font-bold mb-6">MCP HUB</h1>
        <nav className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start pl-4"
            onClick={() => setActiveTab("usage")}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Usage Statistics
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start pl-4"
            onClick={() => setActiveTab("provide")}
          >
            <Package className="w-4 h-4 mr-2" />
            Provide MCPs
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start pl-4"
            onClick={() => setActiveTab("dao")}
          >
            <Users className="w-4 h-4 mr-2" />
            DAO Governance
          </Button>
        </nav>
      </div>

      {/* Wallet Section at Bottom */}
      <div className="mt-auto p-4 border-t space-y-2">
        {account ? (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Balance:</span>
              <span>{parseFloat(balance).toFixed(2)} SAGA</span>
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={disconnectWallet}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {`${account.slice(0, 6)}...${account.slice(-4)}`}
            </Button>
          </>
        ) : (
          <Button className="w-full flex items-center justify-center" onClick={connectWallet}>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </div>
    </aside>
  );
}
