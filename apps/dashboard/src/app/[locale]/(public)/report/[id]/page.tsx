import { BarChart } from "@/components/charts/bar-chart";
import { Chart } from "@/components/charts/chart";
import { Counter } from "@/components/counter";
import { getMetricsQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { format } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = createClient({ admin: true });

  const { data, error } = await supabase
    .from("reports")
    .select("*, team:team_id(name)")
    .eq("id", params.id)
    .single();

  if (error) {
    return;
  }

  const period = `${format(new Date(data.from), "LLL dd, y")} - ${format(
    new Date(data.to),
    "LLL dd, y"
  )}`;

  return {
    title: `Report for ${data.team.name} (${period})`,
    description: `Profit/Loss report for ${data.team.name} based on the period ${period}`,
    robots: {
      index: false,
    },
  };
}

export default async function Report({ params }) {
  const supabase = createClient({ admin: true });

  const { data, error } = await supabase
    .from("reports")
    .select("*, team:team_id(name)")
    .eq("id", params.id)
    .single();

  if (error) {
    return notFound();
  }

  const metricsData = await getMetricsQuery(supabase, {
    teamId: data.team_id,
    from: data.from,
    to: data.to,
    type: data.type,
  });

  const lastPeriodAmount =
    metricsData?.result[metricsData.result?.length - 1]?.current?.value;

  return (
    <div className="h-screen flex flex-col pl-4 pr-4">
      <div className="flex items-center justify-center w-full h-[80px] border-b-[1px]">
        <div className="flex items-center flex-col">
          <div>{data.team.name}</div>
          <span className="text-[#878787]">Profit/Loss</span>
        </div>
      </div>

      <div className="justify-center items-center w-full flex mt-[180px]">
        <div className="w-[1200px]">
          <div className="relative mt-28">
            <div className="absolute -top-[110px] space-y-2">
              <h1 className="text-3xl">
                <Counter
                  value={metricsData.summary.currentTotal}
                  currency={metricsData.summary.currency}
                  lastPeriodAmount={lastPeriodAmount}
                />
              </h1>
            </div>

            <div className="absolute  -top-[110px] right-0 hidden md:block">
              <div className="text-[#878787]">
                {format(new Date(data.from), "LLL dd, y")} -{" "}
                {format(new Date(data.to), "LLL dd, y")}
              </div>
            </div>
          </div>

          <BarChart data={metricsData} />
        </div>
      </div>

      <footer className="flex items-center justify-center w-full mt-auto h-[80px]">
        <div>
          <p className="text-[#878787] text-sm">
            Powered by{" "}
            <a href="https://midday.ai" className="text-black dark:text-white">
              Midday
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
