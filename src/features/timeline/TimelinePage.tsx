import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Circle, Flag } from "lucide-react";

/**
 * The route to a funded summer abroad, ported from the standalone TSX as written — same
 * structure, same copy, same eight phases. The change is the palette, inverted from the
 * original stone-950 dark scheme:
 *
 *   page    bg-stone-950 → bg-stone-100     card   bg-stone-900 → bg-white
 *   body    text-stone-300 → text-stone-700  border border-stone-800 → border-stone-200
 *
 * Accent hues stay put — amber for build phases, teal for outreach and completion, slate
 * for admin, rose for the long game — but the 300/400 weights were picked for a dark
 * ground and go to 600/700 so they hold contrast on white.
 *
 * Not in the nav. Reached at /timeline.
 */

type Task = { id: string; text: string };
type Phase = {
  id: string;
  window: string;
  title: string;
  thesis: string;
  deadline?: string;
  weight: "build" | "send" | "convert" | "admin" | "do" | "compound";
  body: string[];
  tasks: Task[];
  risk?: string;
};

const PHASES: Phase[] = [
  {
    id: "p0",
    window: "13 – 31 Aug 2026",
    title: "Build the one thing that makes everything else work",
    thesis:
      "Nineteen days left of the twenty-one-day plan. One repository, finished, public. Nothing after this phase functions without it.",
    deadline: "Repo public: 31 Aug",
    weight: "build",
    body: [
      "You are two days into the study plan and slightly behind, which is fine — the three consolidation days exist for exactly this. Fold days 1 and 2 into this week rather than trying to reclaim them separately.",
      "The repo is not meant to impress a specialist. Everything in it is a reproduction of published work and any SBI researcher will recognise all of it in under a minute. Its job is narrower: it converts you from an unknown quantity into someone who finishes things, which is the single binary check a professor runs on a cold email.",
      "One part can do better than that. The misspecification experiment — train on simulator A, test on B, show the posterior is narrow and confident and wrong, then catch it with the calibration test you wrote yourself — reads as judgment rather than tooling. Almost nobody who touches the package goes looking for the failure mode. That is your headline figure and the paragraph that earns a real reply instead of a polite one.",
    ],
    tasks: [
      { id: "t1", text: "Week 1 — Bayes, hand-written Metropolis, chain diagnostics" },
      { id: "t2", text: "Week 2 — inverse problems, Tikhonov = MAP derivation, coupling-layer flow from scratch" },
      { id: "t3", text: "Week 3 — sbi package, SBC implemented yourself, misspecification sweep" },
      { id: "t4", text: "README with the rank-histogram figure at the top" },
      { id: "t5", text: "Fresh-clone reproduction test, fixed seeds, locked environment" },
      { id: "t6", text: "CV rewritten to one page — coursework block and repo link above the fold" },
    ],
    risk:
      "If you slip, cut the three-families comparison and sequential-vs-amortized before cutting anything in weeks one or two. Those two days make you sound fluent on a call; the first fortnight is what makes you actually fluent.",
  },
  {
    id: "p1",
    window: "September 2026",
    title: "Send — and talk to someone on your own campus",
    thesis:
      "Ten emails a week, Tuesday to Thursday, arriving 8–10am European time. The campus conversation has a higher expected value than any single one of them.",
    deadline: "First ten emails: Tue 1 Sep",
    weight: "send",
    body: [
      "Go to office hours for your inverse theory or Bayesian course and say exactly what you have been telling me: you want to work in Bayesian inverse problems, you built this in August, you are aiming for a funded summer abroad. Ask what they think and who they know. Academic placements happen through networks and you have one in a building you already walk past. The worst outcome is a project on campus and a recommender who has watched you work.",
      "Second move nobody makes: open the sbi package's issue tracker and fix something small — a broken example, a documentation gap, a wrong docstring. A merged pull request puts your GitHub handle in front of the Tübingen group with zero cold-email friction, and it is a line that reads completely differently from 'I used your package'.",
      "On the emails themselves: under 200 words, the specific paper, their own future work proposed back to them scoped to ten weeks, your repo, and no mention of money. Funding is a phase-three conversation. Raising it early gives a busy person the cheapest possible reason to decline.",
    ],
    tasks: [
      { id: "s1", text: "Target spreadsheet — 60 raw names down to 25 through the four filters" },
      { id: "s2", text: "One-page project proposal template drafted BEFORE the first email goes out" },
      { id: "s3", text: "Office hours with the DS3143 / DS4244 instructor" },
      { id: "s4", text: "One merged pull request on sbi" },
      { id: "s5", text: "Batch 1 sent (10) · Batch 2 (10) · Batch 3 (5)" },
      { id: "s6", text: "Twelve-day follow-ups logged and sent once only" },
    ],
    risk:
      "Filter on capacity to host, not prestige. Assistant professors three to eight years in, groups of four to ten, an ERC grant on CORDIS, and — the filter almost nobody uses — an intern thanked by name in a recent paper's acknowledgements. A group that has hosted will host again.",
  },
  {
    id: "p2",
    window: "October 2026",
    title: "Triage and convert",
    thesis:
      "Roughly one reply in six, and the reply is worthless unless the proposal lands within twenty-four hours.",
    weight: "convert",
    body: [
      "Interested replies get the one-page proposal same day: objective, method, milestones at weeks 3 / 7 / 11, deliverable, what you would need from them. This is why the template is written in September.",
      "A 'no funding this year' is not a rejection, it is a warm contact. Reply, thank them, ask about 2028, and offer to do a small piece of the analysis remotely over the winter at no cost. A meaningful share of long-term supervisor relationships start precisely there.",
      "Calls begin. They are answering one question — can I leave this person alone for a week and get something back. Bring a question only a reader could ask, a task you could start on day one, and one honest sentence about what you cannot yet do. If the transcript comes up, answer in three sentences and return to the work. Over-explaining is what turns a number into a problem.",
    ],
    tasks: [
      { id: "o1", text: "Second wave of 25 names if the first produced nothing" },
      { id: "o2", text: "Proposal sent within 24h of every interested reply" },
      { id: "o3", text: "Remote-contribution offer sent to every 'no budget' reply" },
      { id: "o4", text: "Call prep sheet per call — question, day-one task, honest gap" },
    ],
    risk:
      "Thirty emails with no replies at all means the email is wrong, not the odds. Stop sending and rewrite before burning the rest of the list.",
  },
  {
    id: "p3",
    window: "November – December 2026",
    title: "Lock it, or pivot on purpose",
    thesis:
      "Decide which branch you are on before the mood decides for you. Have the fallback built while you still don't need it.",
    deadline: "Charpak opens ~Nov, closes ~Jan",
    weight: "convert",
    body: [
      "If you have a yes: put it in writing the same day. Dates, duration, supervisor, funding amount, funding mechanism, and the name of the administrative contact. A verbal yes in November gets vague by March; a written summary they replied 'yes, correct' to does not. Then start the work-permit conversation immediately — six to twelve weeks of processing is the binding constraint on everything downstream.",
      "If you don't: this is the planned pivot, not a failure. Go back to every 'no funding' contact with the remote-work offer. And secure a domestic fallback so summer 2027 is not empty on either branch — IUCAA is in Pune, does gravitational-wave data analysis, and neural posterior estimation is standard equipment in that field. It is one of the better places in India for exactly this work and it is a bus ride away. A summer there on real data is a stronger 2028 application than anything you currently hold.",
      "Semester results land now. A visible upward break in Statistical Inference, Bayesian Theory and Deep Learning arrives exactly when decisions are being made, and it is the strongest available answer to a 6.2.",
    ],
    tasks: [
      { id: "n1", text: "Written confirmation email — dates, funding, mechanism, admin contact" },
      { id: "n2", text: "Work-permit conversation opened with the institute" },
      { id: "n3", text: "Charpak application if the host is French (invitation letter already in hand)" },
      { id: "n4", text: "IUCAA and on-campus fallback contacted regardless of branch" },
      { id: "n5", text: "Winter remote contribution started for one group" },
    ],
    risk:
      "The fallback is not a consolation prize and should not be treated as one at the point you need it. Contact IUCAA in November whether or not things are going well abroad.",
  },
  {
    id: "p4",
    window: "January – March 2027",
    title: "Logistics, which is where people actually fail",
    thesis:
      "Nothing here is intellectually hard and all of it is time-bound. This is the phase that eats placements.",
    deadline: "Visa slot booked: March",
    weight: "admin",
    body: [
      "NOC from IISER Pune starts in January — Indian institutional paperwork runs on its own timeline and will not be hurried in April.",
      "Flights booked by February. The difference between a February and an April booking on a June flight is roughly your entire $500, which means booking early is not a saving, it is the budget.",
      "Visa appointment in March, and book the slot before you have every document. Consulate slots disappear months ahead; documents can be brought to an appointment, an appointment cannot be conjured from documents.",
    ],
    tasks: [
      { id: "j1", text: "NOC application submitted (January)" },
      { id: "j2", text: "Work permit filed with institute HR" },
      { id: "j3", text: "Flights booked (February)" },
      { id: "j4", text: "Visa slot booked, then documents assembled (March)" },
      { id: "j5", text: "Travel insurance and registration requirements checked" },
    ],
  },
  {
    id: "p5",
    window: "April – May 2027",
    title: "Arrive not-cold",
    thesis:
      "Turning up able to start on the first Monday puts you ahead of nearly every intern they have hosted.",
    weight: "admin",
    body: [
      "Accommodation through your supervisor's PhD students, not solved alone from India. They know the student housing systems and usually know someone subletting for the summer. Ask directly.",
      "In the four weeks before you fly: read their last three papers properly and reproduce one figure from the one closest to your project. Bring it with you. Have the environment installed and running before you land.",
    ],
    tasks: [
      { id: "a1", text: "Housing secured via the group's PhD students" },
      { id: "a2", text: "Last three papers read; one figure reproduced" },
      { id: "a3", text: "Environment installed and tested before departure" },
      { id: "a4", text: "Day-one question and starting task prepared" },
    ],
  },
  {
    id: "p6",
    window: "June – August 2027",
    title: "The twelve weeks",
    thesis:
      "Whether you get 2028 is decided here, and it is mostly behavioural rather than intellectual.",
    weight: "do",
    body: [
      "Week one: ask for the smallest possible first task and deliver it in three days. You are buying trust and trust compounds — deliver something small in week one and you get the interesting problem in week three.",
      "Every Friday without exception: an unsolicited five-line update. What I did, what I found, what I'm blocked on, what's next. Almost no intern does this, supervisors talk about the ones who do, and it means the final report writes itself from twelve weeks of notes instead of memory.",
      "Never stuck silently for more than half a day, and ask the PhD student rather than the PI — that is what they are there for, and their opinion of you is most of what the PI hears. In week six ask directly what would make this summer a success from their side. In the final fortnight stop experimenting and write.",
    ],
    tasks: [
      { id: "d1", text: "First small task delivered inside three days" },
      { id: "d2", text: "Friday update sent — every single week" },
      { id: "d3", text: "Week six: 'what would make this a success for you?'" },
      { id: "d4", text: "Final two weeks: writing and a reproducible repo, not experiments" },
      { id: "d5", text: "IN PERSON before leaving: ask about 2028 and about MS thesis supervision" },
    ],
    risk:
      "That last conversation happens face to face while they are pleased with you, not by email in January. An email gets a polite maybe; standing in front of someone gets a commitment.",
  },
  {
    id: "p7",
    window: "Sept 2027 → 2029",
    title: "The chain this was all for",
    thesis:
      "Summer 2027 → summer 2028 → MS thesis 2028-29 with the same group → a letter in 2029 from someone who has supervised you three times.",
    weight: "compound",
    body: [
      "One summer is not the object. The object is a supervisor who has watched you work long enough to write a letter with content in it. A 6.2 CGPA is survivable in a PhD application behind a letter like that. It is not survivable without one.",
      "Everything between now and then is a matter of not dropping the thread: stay in contact through the autumn, send them things you have done, and come back with a concrete proposal for 2028 rather than a general availability.",
    ],
    tasks: [
      { id: "c1", text: "Stay in contact through autumn 2027 — send work, not check-ins" },
      { id: "c2", text: "Summer 2028 agreed by January 2028" },
      { id: "c3", text: "MS thesis co-supervision confirmed" },
      { id: "c4", text: "Letters requested by mid-2029 with a reminder packet of your work" },
    ],
  },
];

const ACCENT: Record<Phase["weight"], { dot: string; text: string; ring: string }> = {
  build: { dot: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-500" },
  send: { dot: "bg-teal-500", text: "text-teal-700", ring: "ring-teal-500" },
  convert: { dot: "bg-teal-500", text: "text-teal-700", ring: "ring-teal-500" },
  admin: { dot: "bg-slate-500", text: "text-slate-600", ring: "ring-slate-500" },
  do: { dot: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-500" },
  compound: { dot: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-500" },
};

export function TimelinePage() {
  const [open, setOpen] = useState<string | null>("p0");
  const [done, setDone] = useState<Record<string, boolean>>({});

  const allTasks = PHASES.flatMap((p) => p.tasks);
  const doneCount = allTasks.filter((t) => done[t.id]).length;

  const toggleTask = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));

  return (
    <div className="min-h-screen w-full bg-stone-100 font-sans text-stone-700">
      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* header */}
        <div className="mb-3 font-mono text-xs uppercase tracking-widest text-stone-500">
          13 Aug 2026 → summer 2027 → thesis 2029
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl">
          The route to a funded <span className="text-amber-600">summer abroad</span>
        </h1>
        <p className="mt-4 max-w-xl text-stone-600">
          Eight phases. The first is the only one that is hard; the rest is persistence on a
          schedule. Open a phase to see what it actually involves.
        </p>

        {/* progress */}
        <div className="mt-8 flex items-center gap-4 rounded border border-stone-200 bg-white px-4 py-3">
          <span className="font-mono text-xs text-stone-500">
            {doneCount} / {allTasks.length}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded bg-stone-200">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(doneCount / allTasks.length) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setDone({})}
            className="rounded border border-stone-300 px-2 py-1 font-mono text-xs text-stone-500 hover:border-stone-400 hover:text-stone-700"
          >
            clear
          </button>
        </div>

        {/* timeline */}
        <div className="relative mt-10 border-l border-stone-200 pl-8">
          {PHASES.map((p, i) => {
            const isOpen = open === p.id;
            const a = ACCENT[p.weight];
            const pDone = p.tasks.filter((t) => done[t.id]).length;
            const complete = pDone === p.tasks.length;

            return (
              <div key={p.id} className="relative pb-6">
                {/* node */}
                <span
                  className={`absolute -left-[38px] top-4 h-2.5 w-2.5 rounded-full ${
                    complete ? "bg-teal-500" : a.dot
                  } ${isOpen ? `ring-4 ring-opacity-20 ${a.ring}` : ""}`}
                />

                <button
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className={`w-full rounded border bg-white text-left transition-colors ${
                    isOpen ? "border-stone-300" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-start gap-3 px-5 py-4">
                    <ChevronRight
                      className={`mt-1 h-4 w-4 flex-none text-stone-400 transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <span className={`font-mono text-xs uppercase tracking-wider ${a.text}`}>
                          {p.window}
                        </span>
                        {p.deadline && (
                          <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-600">
                            <Flag className="h-3 w-3" />
                            {p.deadline}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 text-lg font-semibold text-stone-900">{p.title}</h2>
                      {!isOpen && (
                        <p className="mt-1 line-clamp-2 text-sm text-stone-500">{p.thesis}</p>
                      )}
                      <span className="mt-2 block font-mono text-xs text-stone-400">
                        {pDone}/{p.tasks.length} done
                      </span>
                    </div>
                    <span className="font-mono text-xs text-stone-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-2 rounded border border-stone-200 bg-white px-6 py-5">
                    <p className="border-l-2 border-stone-300 pl-4 text-[15px] italic text-stone-700">
                      {p.thesis}
                    </p>

                    <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-stone-600">
                      {p.body.map((para, k) => (
                        <p key={k}>{para}</p>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 font-mono text-xs uppercase tracking-widest text-stone-400">
                        Checklist
                      </div>
                      <ul className="space-y-1">
                        {p.tasks.map((t) => (
                          <li key={t.id}>
                            <button
                              onClick={() => toggleTask(t.id)}
                              className="flex w-full items-start gap-3 rounded px-2 py-1.5 text-left hover:bg-stone-100"
                            >
                              {done[t.id] ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-teal-600" />
                              ) : (
                                <Circle className="mt-0.5 h-4 w-4 flex-none text-stone-400" />
                              )}
                              <span
                                className={`text-sm ${
                                  done[t.id] ? "text-stone-400 line-through" : "text-stone-700"
                                }`}
                              >
                                {t.text}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {p.risk && (
                      <div className="mt-5 flex gap-3 rounded border border-stone-200 bg-stone-50 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
                        <p className="text-sm text-stone-600">{p.risk}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 border-t border-stone-200 pt-6 text-sm text-stone-500">
          Two things are still unbuilt and both block September: the one-page project proposal
          template, and the target spreadsheet with the four filters as columns.
        </p>
      </div>
    </div>
  );
}
