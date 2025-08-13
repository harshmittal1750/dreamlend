"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/ConnectButton";
import { useP2PLending } from "@/hooks/useP2PLending";
import { Home, PlusCircle, List, User, Wallet, BarChart3 } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const { isConnected, address, activeLoanOfferIds } = useP2PLending();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/create",
      label: "Create Offer",
      icon: PlusCircle,
    },
    {
      href: "/offers",
      label: "Browse Offers",
      icon: List,
      badge: activeLoanOfferIds?.length || 0,
    },
    {
      href: "/my-loans",
      label: "My Loans",
      icon: User,
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
  ];

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">DreamLend</span>
            <Badge variant="outline" className="text-xs">
              Somnia L1
            </Badge>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
            {isConnected && address && (
              <div className="hidden sm:block">
                <Card className="px-3 py-1 bg-gray-50">
                  <span className="text-xs font-mono text-gray-600">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </Card>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t pt-2 pb-4">
          <div className="grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="flex flex-col items-center h-auto py-2 px-1"
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 text-xs min-w-[16px] h-4 p-0 flex items-center justify-center"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs mt-1">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
