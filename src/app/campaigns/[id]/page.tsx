import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import type { Campaign, MessageLog } from "@/types/models";

type PageProps = {
  params: { id: string };
};

export default async function CampaignDetailPage({
  params,
}: PageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in");
  }

  const campaignId = params.id;

  // Fetch the campaign (RLS ensures it belongs to this user)
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "id, workspace_id, name, channel, status, subject, body, created_at, updated_at"
    )
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    console.error("Campaign detail fetch error:", campaignError);
    notFound();
  }

  // Fetch recent logs for this campaign
  const { data: logs, error: logsError } = await supabase
    .from("message_logs")
    .select(
      "id, channel, provider, provider_message_id, status, error_message, created_at, contact_id"
    )
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (logsError) {
    console.error("Campaign logs fetch error:", logsError);
  }

  const userEmail = user.email ?? null;

  return (
    <AppShell title={`Campaign: ${campaign.name}`} userEmail={userEmail}>
      <CampaignSummary campaign={campaign} logs={logs ?? []} />
      <CampaignLogsTable logs={logs ?? []} />
    </AppShell>
  );
}

// ----- Detail components (client-free, just props) -----

type CampaignDetail = Campaign & {
  subject: string | null;
  body: string | null;
};

function CampaignSummary({
  campaign,
  logs,
}: {
  campaign: CampaignDetail;
  logs: Partial<MessageLog>[];
}) {
  const sentCount = logs.filter(
    (l) => l.status === "sent"
  ).length;
  const failedCount = logs.filter(
    (l) => l.status === "failed"
  ).length;

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-medium">
          Campaign details
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Basic info and content.
        </p>

        <dl className="grid gap-2 text-sm">
          <DetailRow
            label="Name"
            value={campaign.name}
          />
          <DetailRow
            label="Channel"
            value={campaign.channel.toUpperCase()}
          />
          <DetailRow
            label="Status"
            value={campaign.status}
          />
          <DetailRow
            label="Created"
            value={new Date(
              campaign.created_at
            ).toLocaleString()}
          />
          <DetailRow
            label="Updated"
            value={new Date(
              campaign.updated_at
            ).toLocaleString()}
          />
          <DetailRow
            label="Messages sent"
            value={`${sentCount} sent, ${failedCount} failed`}
          />
        </dl>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-medium">
          Content
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Subject and body currently configured for this
          campaign.
        </p>

        {campaign.channel === "email" && (
          <div className="mb-3 text-sm">
            <div className="text-xs font-medium text-muted-foreground">
              Subject
            </div>
            <div>
              {campaign.subject || (
                <span className="text-muted-foreground">
                  (no subject set)
                </span>
              )}
            </div>
          </div>
        )}

        <div className="text-sm">
          <div className="text-xs font-medium text-muted-foreground">
            Body
          </div>
          <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
            {campaign.body || "(no body set)"}
          </pre>
        </div>
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-right">
        {value}
      </span>
    </div>
  );
}

function CampaignLogsTable({ logs }: { logs: Partial<MessageLog>[] }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-2 text-sm font-medium">
        Recent sends
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Up to the last 50 messages for this campaign.
      </p>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No messages have been sent for this campaign yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 text-left">Time</th>
                <th className="py-2 text-left">Channel</th>
                <th className="py-2 text-left">Provider</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Provider ID</th>
                <th className="py-2 text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b last:border-0"
                >
                  <td className="py-1 pr-4">
                    {log.created_at
                      ? new Date(
                          log.created_at
                        ).toLocaleString()
                      : "-"}
                  </td>
                  <td className="py-1 pr-4 uppercase">
                    {log.channel}
                  </td>
                  <td className="py-1 pr-4">
                    {log.provider}
                  </td>
                  <td className="py-1 pr-4">
                    {log.status}
                  </td>
                  <td className="py-1 pr-4 max-w-[160px] truncate">
                    {log.provider_message_id ?? "-"}
                  </td>
                  <td className="py-1 pr-4 max-w-[200px] truncate text-red-600">
                    {log.error_message ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}