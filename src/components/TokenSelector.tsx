"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Check } from "lucide-react";
import {
  TokenInfo,
  getAllSupportedTokens,
  TOKEN_CATEGORIES,
  RISK_COLORS,
  formatBasisPoints,
  DEFAULT_PARAMETERS,
} from "@/config/tokens";

interface TokenSelectorProps {
  selectedToken?: TokenInfo;
  onTokenSelect: (token: TokenInfo) => void;
  label: string;
  placeholder?: string;
  excludeToken?: TokenInfo; // Don't show this token in the list (e.g., can't use same token for loan and collateral)
}

export function TokenSelector({
  selectedToken,
  onTokenSelect,
  label,
  placeholder = "Select a token",
  excludeToken,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const allTokens = getAllSupportedTokens();

  // Filter out tokens with placeholder addresses (0x000...000) and excluded tokens
  const availableTokens = allTokens.filter((token) => {
    // Exclude tokens with zero address (unassigned placeholders)
    if (token.address === "0x0000000000000000000000000000000000000000") {
      return false;
    }
    // Exclude the specified token (e.g., can't use same token for loan and collateral)
    if (excludeToken && token.address === excludeToken.address) {
      return false;
    }
    return true;
  });

  const handleSelect = (token: TokenInfo) => {
    onTokenSelect(token);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="token-selector" className="text-base font-medium">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="token-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto p-3"
          >
            {selectedToken ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedToken.symbol}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        RISK_COLORS[selectedToken.volatilityTier]
                      }`}
                    >
                      {selectedToken.volatilityTier}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedToken.name}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <div className="max-h-[300px] overflow-y-auto">
            {Object.entries(TOKEN_CATEGORIES).map(([categoryKey, category]) => {
              const categoryTokens = category.tokens.filter((token) => {
                // Exclude tokens with zero address (unassigned placeholders)
                if (
                  token.address === "0x0000000000000000000000000000000000000000"
                ) {
                  return false;
                }
                // Exclude the specified token
                if (excludeToken && token.address === excludeToken.address) {
                  return false;
                }
                return true;
              });

              if (categoryTokens.length === 0) return null;

              return (
                <div key={categoryKey} className="p-2">
                  <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                    {category.name}
                  </div>
                  <div className="text-xs text-muted-foreground px-2 mb-2">
                    {category.description}
                  </div>

                  {categoryTokens.map((token) => (
                    <button
                      key={token.address}
                      className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
                      onClick={() => handleSelect(token)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.symbol}</span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                RISK_COLORS[token.volatilityTier]
                              }`}
                            >
                              {token.volatilityTier}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {token.name}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            Min Collateral:{" "}
                            {formatBasisPoints(
                              DEFAULT_PARAMETERS[token.volatilityTier]
                                .minCollateralRatio
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedToken?.address === token.address && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              );
            })}

            {availableTokens.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No tokens available
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedToken && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <div className="font-medium mb-1">{selectedToken.description}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium">Volatility:</span>{" "}
              {selectedToken.volatilityTier}
            </div>
            <div>
              <span className="font-medium">Decimals:</span>{" "}
              {selectedToken.decimals}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
