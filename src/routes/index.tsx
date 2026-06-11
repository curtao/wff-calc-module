import { createFileRoute } from "@tanstack/react-router";
import { WebflowCalculator } from "@/components/calculator/WebflowCalculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Webflow Project Calculator" },
      {
        name: "description",
        content:
          "Estimate your Webflow project quote and deadline based on experience, scope, complexity and fees.",
      },
      { property: "og:title", content: "Webflow Project Calculator" },
      {
        property: "og:description",
        content:
          "Estimate your Webflow project quote and deadline based on experience, scope, complexity and fees.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen w-full">
      <WebflowCalculator />
    </div>
  );
}
