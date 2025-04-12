"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStory } from "@/lib/context/StoryContext";
import { storyProtocol } from "@/lib/storyProtocol";

import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";

export default function PurchasePage({ params }: { params: { id: string } }) {
  const { client, setTxLoading, setTxHash, setTxName, isInitialized } = useStory();
  const {
    isConnected,
    walletState: { account },
  } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [licenseId, setLicenseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // In a real implementation, we would fetch the bundle data using the ID
  const bundleId = params.id;

  // If wallet disconnects during the process, go back to recipe details page
  useEffect(() => {
    if (!isConnected) {
      router.push(`/story-protocol/${bundleId}`);
    }
  }, [isConnected, bundleId, router]);

  const handlePurchase = async () => {
    if (!isConnected || !client) {
      setError("Please connect your wallet to purchase this recipe");
      return;
    }

    setIsSubmitting(true);
    setTxLoading(true);
    setTxName("Purchasing Recipe License");
    setError(null);

    try {
      // For demo purposes, we're using a hardcoded licenseTermsId and licensorIpId
      // In a real implementation, we would fetch these from the API
      const licenseTermsId = "1";
      const licensorIpId = "0xC92EC2f4c86458AFee7DD9EB5d8c57920BfCD0Ba" as `0x${string}`;
      const receiverAddress = account as `0x${string}`;

      // Simulate a successful purchase
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess(true);
      setLicenseId("LIC_" + Math.random().toString(36).substring(2, 10));
      setTxHash("0x" + Math.random().toString(36).substring(2, 40));
    } catch (error) {
      console.error("Error purchasing license:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setTxLoading(false);
    }
  };

  // Show loading while Story Protocol client initializes
  if (!isInitialized) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Link
          href={`/story-protocol/${bundleId}`}
          className="inline-flex items-center text-sm text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Recipe Details
        </Link>

        <h1 className="text-3xl font-bold mb-6">Purchase Recipe License</h1>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-xl font-medium">Initializing Story Protocol Client</h3>
            <p className="text-muted-foreground">
              Please wait while we set up your purchase experience...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href={`/story-protocol/${bundleId}`}
        className="inline-flex items-center text-sm text-muted-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Recipe Details
      </Link>

      <h1 className="text-3xl font-bold mb-6">Purchase Recipe License</h1>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-500/10">
          <AlertDescription className="text-red-500">{error}</AlertDescription>
        </Alert>
      )}

      {success ? (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mr-2" />
              Purchase Successful
            </CardTitle>
            <CardDescription>You now have a license to use this recipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">License ID</p>
                <p className="text-sm text-muted-foreground">{licenseId}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">What's Next?</p>
                <p className="text-sm text-muted-foreground">
                  You can now use this recipe in your projects. The license entitles you to use all
                  the MCPs included in this recipe according to the license terms.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/story-protocol/${bundleId}`}>Return to Recipe</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Purchase</CardTitle>
            <CardDescription>You're about to purchase a license for this recipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Recipe ID</p>
                <p className="text-sm text-muted-foreground">{bundleId}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">License Terms</p>
                <p className="text-sm text-muted-foreground">
                  This license entitles you to use the recipe and all included MCPs according to the
                  terms set by the creator. You may use the recipe for commercial purposes with
                  proper attribution to the original creator.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Payment Details</p>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm">License Fee</span>
                  <span className="text-sm font-medium">0.01 ETH</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm">Network Fee</span>
                  <span className="text-sm font-medium">~0.002 ETH</span>
                </div>
                <div className="flex justify-between py-2 font-medium">
                  <span>Total</span>
                  <span>0.012 ETH</span>
                </div>
              </div>
              <div className="flex items-center text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  Connected as{" "}
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Unknown"}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handlePurchase} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
