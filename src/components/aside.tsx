import { Button } from "@/components/ui/button";
import { BarChart2, Package, Users, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

interface AsideProps {
  isSidebarOpen: boolean;
}

export function Aside({ isSidebarOpen }: AsideProps) {
  const pathname = usePathname();
  const { walletState, connectWallet, disconnectWallet } = useWallet();
  const { account, balance } = walletState;

  const menuItems = [
    {
      label: "Usage Statistics",
      icon: BarChart2,
      href: "/",
    },
    {
      label: "Provide MCPs",
      icon: Package,
      href: "/provide-mcps",
    },
    {
      label: "DAO Governance",
      icon: Users,
      href: "/dao-governance",
    },
  ];

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
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = pathname === item.href;

            return (
              <Button
                key={item.href}
                variant={isSelected ? "secondary" : "ghost"}
                className="w-full justify-start pl-4"
                asChild
              >
                <Link href={item.href}>
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Wallet Section at Bottom */}
      <div className="mt-auto p-4 border-t space-y-2">
        {account ? (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Balance:</span>
              <span>{parseFloat(balance).toFixed(2)} NEX</span>
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
          <Button
            className="w-full flex items-center justify-center"
            onClick={() => connectWallet()}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </div>
    </aside>
  );
}
