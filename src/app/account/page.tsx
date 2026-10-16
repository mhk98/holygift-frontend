import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AccountClient from "./AccountClient";

export default function AccountPage() {
  // AccountClient reads ?tab= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <AccountClient header={<SiteHeader />} footer={<SiteFooter />} />
    </Suspense>
  );
}
