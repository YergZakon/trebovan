"use client";

import BubbleChartSection from "@/components/charts/BubbleChartSection";

type SectionPoint = {
  section: string;
  name: string;
  businesses: number;
  avgReqs: number;
  avgSpheres: number;
};

export default function SectionsChartWrapper({ data }: { data: SectionPoint[] }) {
  return <BubbleChartSection data={data} />;
}
