import React, { useState } from 'react';
import {
  Inbox,
  FileCheck,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Sparkles,
  Zap,
  Layers,
  Database,
  Terminal,
  Cpu,
  AlertTriangle,
  Play,
  Download,
  Building2,
  Calendar,
  DollarSign,
  Plus,
  ExternalLink,
  Eye,
  Paperclip,
  Check,
  ChevronRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import {
  IntakeRequestItem,
  QuoteEntity,
  ProjectEntity,
  PaymentEntity,
  AssignmentEntity,
  WorkflowWebhookEvent,
  AutomationRulesConfig,
  UserEntity,
} from '../../types/workflow';
import {
  INITIAL_INTAKE_REQUESTS,
  INITIAL_QUOTES,
  INITIAL_PROJECTS,
  INITIAL_PAYMENTS,
  INITIAL_WEBHOOK_EVENTS,
  DEFAULT_AUTOMATION_RULES,
  INITIAL_USERS,
} from '../../data/workflowData';
import { DatabaseSchemaModal } from './DatabaseSchemaModal';
import { ApiEventFlowViewer } from './ApiEventFlowViewer';
import { ClientPortalModal } from './ClientPortalModal';
import { QuotationBuilderModal } from './QuotationBuilderModal';
import { IntakeRequestModal } from './IntakeRequestModal';
import { LogicRulesModal } from './LogicRulesModal';

export const WorkflowAutomationHub: React.FC = () => {
  // State for all workflow entities
  const [intakeRequests, setIntakeRequests] = useState<IntakeRequestItem[]>(INITIAL_INTAKE_REQUESTS);
  const [quotes, setQuotes] = useState<QuoteEntity[]>(INITIAL_QUOTES);
  const [projects, setProjects] = useState<ProjectEntity[]>(INITIAL_PROJECTS);
  const [payments, setPayments] = useState<PaymentEntity[]>(INITIAL_PAYMENTS);
  const [events, setEvents] = useState<WorkflowWebhookEvent[]>(INITIAL_WEBHOOK_EVENTS);
  const [users, setUsers] = useState<UserEntity[]>(INITIAL_USERS);
  const [rules, setRules] = useState<AutomationRulesConfig>(DEFAULT_AUTOMATION_RULES);

  // Active Stage Filter / Tab
  const [activePipelineStage, setActivePipelineStage] = useState<
    'all' | 'intake' | 'quotes' | 'payments' | 'projects' | 'qa_delivery'
  >('all');

  // Modal Visibility States
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isApiFlowModalOpen, setIsApiFlowModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);

  // Selected Entities for Modals
  const [selectedIntake, setSelectedIntake] = useState<IntakeRequestItem | null>(null);
  const [selectedQuoteForPortal, setSelectedQuoteForPortal] = useState<QuoteEntity>(quotes[0]);

  // Log Webhook helper
  const logWebhookEvent = (
    eventType: WorkflowWebhookEvent['eventType'],
    sourceService: WorkflowWebhookEvent['sourceService'],
    entityId: string,
    payloadSummary: string
  ) => {
    const newEvt: WorkflowWebhookEvent = {
      id: `evt-${Date.now()}`,
      eventId: `wh_evt_${Math.random().toString(36).substring(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sourceService,
      entityId,
      payloadSummary,
      status: 'delivered',
    };
    setEvents((prev) => [newEvt, ...prev]);
  };

  // Smart Allocation Logic Function
  const runSmartResourceAllocation = (project: ProjectEntity) => {
    // 1. Check estimators who are below the overload threshold
    const candidates = users.filter((u) => u.role === 'estimator' || u.role === 'senior_auditor');

    // Score formula:
    // Score = (Qualification_Overlap * 0.40) + ((40 - Current_Hours)/40 * 0.35) + ((Rating/5) * 0.25)
    const scoredCandidates = candidates.map((cand) => {
      const currentHours = cand.currentWeeklyHours || 38;
      const capacityScore = Math.max(0, (40 - currentHours) / 40);
      const perfScore = (cand.performanceRating || 4.5) / 5;

      // Check qualification overlap
      const hasDirectSkill = cand.qualifications?.some((q) =>
        project.csiDivisions.some((csi) => q.toLowerCase().includes(csi.toLowerCase().split(' ')[1] || ''))
      );
      const qualScore = hasDirectSkill ? 1.0 : 0.6;

      const compositeScore = Math.round((qualScore * 0.4 + capacityScore * 0.35 + perfScore * 0.25) * 100);

      return {
        candidate: cand,
        score: compositeScore,
        currentHours,
        isOverloaded: currentHours >= rules.overloadFallbackThresholdHours,
      };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    const topCandidate = scoredCandidates[0];

    if (!topCandidate || topCandidate.isOverloaded || topCandidate.score < rules.minQualificationMatchScore) {
      // Fallback: route to PM fallback queue
      logWebhookEvent(
        'resource.fallback_escalated',
        'SmartAllocator',
        project.id,
        `All qualified estimators overloaded (> ${rules.overloadFallbackThresholdHours}h). Project escalated to PM Fallback Queue.`
      );
      return;
    }

    // Assign top candidate
    const newAssignment: AssignmentEntity = {
      id: `ASN-2024-${Math.floor(100 + Math.random() * 900)}`,
      projectId: project.id,
      assignedUserId: topCandidate.candidate.id,
      assignedUserName: topCandidate.candidate.fullName,
      assignedUserRole: topCandidate.candidate.role,
      roleOnProject: `Lead Takeoff Specialist (${project.csiDivisions[0] || 'General'})`,
      allocatedWeeklyHours: 14,
      method: 'smart_auto',
      matchedScorePercent: topCandidate.score,
      matchReasons: [
        `Optimal capacity availability (${40 - topCandidate.currentHours}h remaining)`,
        `Qualification verified in ${topCandidate.candidate.qualifications?.[0]}`,
        `Rating score ${(topCandidate.candidate.performanceRating || 4.8).toFixed(2)}/5.0`,
      ],
      assignedAt: new Date().toISOString(),
    };

    // Update project assignments
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== project.id) return p;
        return {
          ...p,
          status: 'in_progress',
          assignments: [newAssignment],
        };
      })
    );

    // Update user hours
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== topCandidate.candidate.id) return u;
        return {
          ...u,
          currentWeeklyHours: (u.currentWeeklyHours || 26) + 14,
        };
      })
    );

    logWebhookEvent(
      'resource.auto_allocated',
      'SmartAllocator',
      newAssignment.id,
      `Smart Algorithm assigned ${topCandidate.candidate.fullName} (Score: ${topCandidate.score}%) to Project #${project.projectCode}`
    );
  };

  // Instant Project Activation Trigger from Client Payment
  const handleClientApproveAndPay = (
    quoteId: string,
    signerName: string,
    signerTitle: string,
    paymentMethod: 'card' | 'ach',
    cardLast4: string
  ) => {
    const targetQuote = quotes.find((q) => q.id === quoteId);
    if (!targetQuote) return;

    const depositAmount = targetQuote.requiredDepositAmount;
    const paymentId = `PAY-2024-${Math.floor(100 + Math.random() * 900)}`;
    const newProjectId = `PRJ-2024-${targetQuote.quoteNumber.replace('QTE-2024-', '')}`;

    // 1. Create Payment Record
    const newPayment: PaymentEntity = {
      id: paymentId,
      quoteId: targetQuote.id,
      projectId: newProjectId,
      amount: depositAmount,
      currency: 'USD',
      paymentType: 'deposit_mobilization',
      paymentGateway: paymentMethod === 'card' ? 'stripe_elements' : 'stripe_ach',
      gatewayTransactionId: `pi_3Pz7Q12eZvKYlo2C${Math.random().toString(36).substring(2, 8)}`,
      status: 'deposit_cleared',
      paidAt: new Date().toISOString(),
      payerName: signerName,
      payerEmail: targetQuote.client.email,
      receiptUrl: `https://pay.stripe.com/receipts/acct_bidexact/${paymentId}`,
      cardLast4: cardLast4,
      cardBrand: paymentMethod === 'card' ? 'Visa Corporate' : 'Chase ACH Direct',
    };

    setPayments((prev) => [newPayment, ...prev]);

    // 2. Log Stripe Webhook
    logWebhookEvent(
      'payment.deposit_succeeded',
      'StripeWebhook',
      newPayment.id,
      `Stripe charge cleared: $${depositAmount.toLocaleString()} deposit for Quote #${targetQuote.quoteNumber}`
    );

    // 3. Update Quote to Paid & Activated
    const updatedQuote: QuoteEntity = {
      ...targetQuote,
      status: 'paid_and_activated',
      approvedAt: new Date().toISOString(),
      clientSignature: {
        signerName,
        signerTitle,
        signedTimestamp: new Date().toISOString(),
        ipAddress: '198.51.100.42 (Client Office)',
      },
      activatedProjectId: newProjectId,
      linkedPaymentId: newPayment.id,
    };

    setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updatedQuote : q)));
    setSelectedQuoteForPortal(updatedQuote);

    // 4. Instantly Activate Project in PM Engine
    const newProject: ProjectEntity = {
      id: newProjectId,
      quoteId: targetQuote.id,
      projectCode: newProjectId,
      title: targetQuote.title,
      clientName: signerName,
      clientCompany: targetQuote.client.company,
      clientEmail: targetQuote.client.email,
      scopeSummary: targetQuote.scopeSummary,
      csiDivisions: targetQuote.csiDivisions,
      contractValue: targetQuote.totalAmount,
      depositPaid: depositAmount,
      status: 'active',
      priority: 'HIGH',
      startDate: new Date().toISOString().slice(0, 10),
      targetDueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      estimatedHours: 65,
      loggedHours: 0,
      completionPercent: 15,
      assignments: [],
      milestones: [
        { id: 'm-1', title: 'Specifications Audit', description: 'CSI Division verification', dueDate: 'Day 3', status: 'in_progress' },
        { id: 'm-2', title: 'QTO Quantity Modeling', description: 'Dual takeoff calculation', dueDate: 'Day 7', status: 'pending' },
        { id: 'm-3', title: 'QA 4-Point Peer Sign-Off', description: 'Spec & variance check', dueDate: 'Day 11', status: 'pending' },
        { id: 'm-4', title: 'Deliverables Release', description: 'Client portal vault release', dueDate: 'Day 14', status: 'pending' },
      ],
      qaReviewProtocol: {
        specComplianceVerified: false,
        doubleTakeoffRecountPassed: false,
        materialPricingVerified: false,
        seniorAuditorSignoff: false,
        variancePercentage: 0.08,
        auditPassed: false,
      },
      deliverables: [],
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProject, ...prev]);

    logWebhookEvent(
      'project.activated',
      'ProjectActivator',
      newProject.id,
      `Project #${newProject.projectCode} automatically activated with $${newProject.contractValue.toLocaleString()} contract value`
    );

    // 5. Automatically Run Smart Resource Allocation
    setTimeout(() => {
      runSmartResourceAllocation(newProject);
    }, 400);
  };

  // Handle Quote creation from QuotationBuilderModal
  const handleCreateQuote = (newQuote: QuoteEntity) => {
    setQuotes((prev) => [newQuote, ...prev]);

    // If linked to an intake, mark intake as converted
    if (newQuote.intakeRequestId) {
      setIntakeRequests((prev) =>
        prev.map((item) =>
          item.id === newQuote.intakeRequestId
            ? { ...item, status: 'converted_to_quote', convertedQuoteId: newQuote.id }
            : item
        )
      );
    }

    logWebhookEvent(
      'quote.dispatched',
      'QuotationEngine',
      newQuote.id,
      `Quotation #${newQuote.quoteNumber} issued and dispatched to ${newQuote.client.email} with dynamic approval token`
    );
  };

  // Handle Intake creation
  const handleCreateNewIntake = (newIntake: IntakeRequestItem) => {
    setIntakeRequests((prev) => [newIntake, ...prev]);
    logWebhookEvent(
      'intake.received',
      'EmailIngestWorker',
      newIntake.id,
      `Inbound RFQ parsed: "${newIntake.projectTitle}" from ${newIntake.clientCompany}`
    );
  };

  // QA 4-Point Gating Sign-off and Deliverables Release
  const handleSignOffQaAndDeliver = (projectId: string) => {
    setProjects((prev) =>
      prev.map((prj) => {
        if (prj.id !== projectId) return prj;

        const updatedQa = {
          specComplianceVerified: true,
          doubleTakeoffRecountPassed: true,
          materialPricingVerified: true,
          seniorAuditorSignoff: true,
          auditorName: 'Marcus Vance',
          auditedAt: new Date().toISOString(),
          variancePercentage: 0.04,
          auditPassed: true,
        };

        const finalDeliverables = [
          {
            id: `del-${Date.now()}-1`,
            fileName: `${prj.projectCode}_Quantity_Takeoff_Final.xlsx`,
            fileSize: '24.8 MB',
            fileType: 'xlsx' as const,
            downloadUrl: '#',
            releasedAt: new Date().toISOString(),
          },
          {
            id: `del-${Date.now()}-2`,
            fileName: `BidExact_Accuracy_Guarantee_Certificate.pdf`,
            fileSize: '3.1 MB',
            fileType: 'pdf' as const,
            downloadUrl: '#',
            releasedAt: new Date().toISOString(),
          },
        ];

        return {
          ...prj,
          status: 'delivered',
          completionPercent: 100,
          qaReviewProtocol: updatedQa,
          deliverables: finalDeliverables,
          deliveredAt: new Date().toISOString(),
          clientNotifiedAt: new Date().toISOString(),
        };
      })
    );

    logWebhookEvent(
      'qa.protocol_passed',
      'QAEvaluationService',
      projectId,
      `4-Point QA checklist verified by Marcus Vance. Takeoff variance: 0.04%.`
    );

    logWebhookEvent(
      'deliverables.released',
      'QAEvaluationService',
      projectId,
      `Final deliverables unlocked in Client Portal vault and GC notified via email.`
    );
  };

  // Calculate totals
  const totalDepositInflow = payments
    .filter((p) => p.status === 'deposit_cleared' || p.status === 'fully_paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeProjectsCount = projects.filter((p) => p.status === 'active' || p.status === 'in_progress').length;
  const pendingIntakeCount = intakeRequests.filter((i) => i.status === 'pending_review').length;
  const pendingQuotesCount = quotes.filter((q) => q.status === 'sent' || q.status === 'viewed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Fast Action Row */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4edea3]/20 to-[#0566d9]/20 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <span>Automated Workflow Command Center</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#4edea3]/15 border border-[#4edea3]/30 text-xs font-mono text-[#4edea3] font-semibold">
                    End-to-End Orchestration
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#86948a]">
                  Unified ingestion &rarr; Quotation &rarr; Stripe Deposit &rarr; Auto-Activation &rarr; Smart Allocation &rarr; QA Delivery
                </p>
              </div>
            </div>
          </div>

          {/* Quick Deliverable Inspector Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap font-mono text-xs">
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-[#0b1326] hover:bg-[#172036] border border-[#222a3d] text-[#dae2fd] hover:text-[#4edea3] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#4edea3]" />
              <span>Database Schema (ERD)</span>
            </button>

            <button
              onClick={() => setIsApiFlowModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-[#0b1326] hover:bg-[#172036] border border-[#222a3d] text-[#dae2fd] hover:text-[#adc6ff] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-[#adc6ff]" />
              <span>API &amp; Event Stream</span>
            </button>

            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-[#0b1326] hover:bg-[#172036] border border-[#222a3d] text-[#dae2fd] hover:text-[#e0b44a] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#e0b44a]" />
              <span>Logic Rules</span>
            </button>

            <button
              onClick={() => {
                setSelectedQuoteForPortal(quotes[0]);
                setIsClientPortalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0566d9] hover:bg-[#0452b0] text-white font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Client Portal</span>
            </button>
          </div>
        </div>

        {/* Real-Time Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-[#222a3d]">
          <div className="p-3.5 rounded-xl bg-[#0b1326] border border-[#222a3d]">
            <div className="text-[11px] font-mono text-[#86948a] uppercase flex items-center justify-between">
              <span>Stripe Deposit Inflow</span>
              <DollarSign className="w-3.5 h-3.5 text-[#4edea3]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#4edea3] mt-1">
              ${totalDepositInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#86948a] font-mono mt-0.5">
              100% Verified Clearance Rate
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b1326] border border-[#222a3d]">
            <div className="text-[11px] font-mono text-[#86948a] uppercase flex items-center justify-between">
              <span>Pending Intake RFQs</span>
              <Inbox className="w-3.5 h-3.5 text-[#adc6ff]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {pendingIntakeCount} Packages
            </div>
            <div className="text-[10px] text-[#adc6ff] font-mono mt-0.5">
              Parsed via Inbound Webhook
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b1326] border border-[#222a3d]">
            <div className="text-[11px] font-mono text-[#86948a] uppercase flex items-center justify-between">
              <span>Dispatched Quotes</span>
              <FileCheck className="w-3.5 h-3.5 text-[#e0b44a]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {pendingQuotesCount} Active
            </div>
            <div className="text-[10px] text-[#e0b44a] font-mono mt-0.5">
              Awaiting E-Sign &amp; Deposit
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b1326] border border-[#222a3d]">
            <div className="text-[11px] font-mono text-[#86948a] uppercase flex items-center justify-between">
              <span>Active Pre-Con Projects</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#4edea3]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
              {activeProjectsCount} Projects
            </div>
            <div className="text-[10px] text-[#4edea3] font-mono mt-0.5">
              Smart-Allocated Workloads
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Interactive Pipeline Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-[#131b2e] border border-[#222a3d] rounded-xl font-mono text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setActivePipelineStage('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activePipelineStage === 'all'
                ? 'bg-[#4edea3] text-[#0b1326] font-bold shadow'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            All 5 Stages
          </button>
          <button
            onClick={() => setActivePipelineStage('intake')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePipelineStage === 'intake'
                ? 'bg-[#3b82f6] text-white font-bold shadow'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            <span>1. Intake Queue ({intakeRequests.length})</span>
          </button>
          <button
            onClick={() => setActivePipelineStage('quotes')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePipelineStage === 'quotes'
                ? 'bg-[#3b82f6] text-white font-bold shadow'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            <span>2. Quotations ({quotes.length})</span>
          </button>
          <button
            onClick={() => setActivePipelineStage('payments')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePipelineStage === 'payments'
                ? 'bg-[#3b82f6] text-white font-bold shadow'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            <span>3. Stripe Deposits ({payments.length})</span>
          </button>
          <button
            onClick={() => setActivePipelineStage('projects')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePipelineStage === 'projects'
                ? 'bg-[#3b82f6] text-white font-bold shadow'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            <span>4. Active Projects ({projects.length})</span>
          </button>
          <button
            onClick={() => setActivePipelineStage('qa_delivery')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePipelineStage === 'qa_delivery'
                ? 'bg-[#3b82f6] text-white font-bold shadow'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            <span>5. QA &amp; Deliverables</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedIntake(null);
              setIsIntakeModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-lg bg-[#172036] hover:bg-[#222a3d] border border-[#2d3449] text-xs font-mono text-[#adc6ff] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Inbound RFQ</span>
          </button>
          <button
            onClick={() => {
              setSelectedIntake(null);
              setIsQuoteBuilderOpen(true);
            }}
            className="h-9 px-3.5 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Draft Quotation</span>
          </button>
        </div>
      </div>

      {/* STAGE 1: Intake & Request Visibility */}
      {(activePipelineStage === 'all' || activePipelineStage === 'intake') && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#3b82f6]/20 text-[#adc6ff] text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Quote Intake &amp; Visibility Queue</span>
                  <span className="text-xs font-mono text-[#86948a] font-normal">
                    (Email Parser Webhooks &amp; Client Web Portal)
                  </span>
                </h2>
              </div>
            </div>

            <div className="text-xs font-mono text-[#86948a]">
              Auto-Extracts Drawing Attachments &amp; NLP Classifies CSI Divisions
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {intakeRequests.map((intake) => (
              <div
                key={intake.id}
                className="p-4 rounded-xl bg-[#0b1326] border border-[#222a3d] hover:border-[#3b4763] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#171f33] text-[#adc6ff] font-bold">
                      {intake.id}
                    </span>
                    <span className="text-[#86948a]">{intake.submittedAt}</span>
                    <span className="text-[#86948a]">&bull;</span>
                    <span className="text-white font-medium">{intake.clientCompany}</span>
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                        intake.urgency === 'critical'
                          ? 'bg-[#ff7886]/20 text-[#ff7886]'
                          : 'bg-[#ffb356]/20 text-[#ffb356]'
                      }`}
                    >
                      {intake.urgency}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {intake.projectTitle}
                  </h3>

                  <p className="text-xs text-[#bbcabf] line-clamp-2">
                    {intake.scopeSummary}
                  </p>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {intake.detectedCsiDivisions.map((csi) => (
                      <span
                        key={csi}
                        className="px-2 py-0.5 rounded bg-[#131b2e] border border-[#222a3d] text-[#4edea3] text-[11px] font-mono"
                      >
                        {csi}
                      </span>
                    ))}
                    <span className="text-xs font-mono text-[#86948a] flex items-center gap-1 ml-2">
                      <Paperclip className="w-3 h-3 text-[#adc6ff]" />
                      {intake.attachments.length} drawings/specs
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      setSelectedIntake(intake);
                      setIsIntakeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] border border-[#2d3449] cursor-pointer"
                  >
                    Inspect Intake
                  </button>

                  {intake.status === 'pending_review' ? (
                    <button
                      onClick={() => {
                        setSelectedIntake(intake);
                        setIsQuoteBuilderOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                    >
                      <span>Draft Quotation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 font-bold">
                      Converted #{intake.convertedQuoteId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 2: Quotations & Automated Delivery */}
      {(activePipelineStage === 'all' || activePipelineStage === 'quotes') && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Quotation Generation &amp; Automated Delivery</span>
                  <span className="text-xs font-mono text-[#86948a] font-normal">
                    (Structured Estimates &amp; Dynamic Approval Tokens)
                  </span>
                </h2>
              </div>
            </div>

            <div className="text-xs font-mono text-[#86948a]">
              Automated Email Dispatch with 1-Click Client Portal Approval Links
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="p-4 rounded-xl bg-[#0b1326] border border-[#222a3d] hover:border-[#3b4763] transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 font-mono text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] font-bold border border-[#4edea3]/20">
                      {quote.quoteNumber}
                    </span>
                    <span className="text-white font-bold">{quote.client.company}</span>
                    <span className="text-[#86948a]">&bull;</span>
                    <span className="text-[#86948a]">Attn: {quote.client.name}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                    {quote.title}
                  </h3>
                  <p className="text-[11px] text-[#bbcabf] font-sans line-clamp-2">{quote.scopeSummary}</p>

                  <div className="flex items-center gap-4 text-[#86948a] text-[11px] pt-0.5 flex-wrap">
                    <span>
                      Project cost: <strong className="text-white">${quote.totalAmount.toLocaleString()}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Pending cost: <strong className="text-[#ffcf70]">${Math.max(0, quote.totalAmount - (quote.status === 'paid_and_activated' ? quote.requiredDepositAmount : 0)).toLocaleString()}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Deposit due: <strong className="text-[#4edea3]">${quote.requiredDepositAmount.toLocaleString()}</strong> ({quote.requiredDepositPercent}%)
                    </span>
                    <span>&bull;</span>
                    <span>Token: <code className="text-[#adc6ff]">{quote.approvalToken}</code></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase ${
                      quote.status === 'paid_and_activated'
                        ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                        : 'bg-[#e0b44a]/15 text-[#e0b44a] border border-[#e0b44a]/30'
                    }`}
                  >
                    {quote.status.replace(/_/g, ' ')}
                  </span>

                  {/* Test in Client Portal Button */}
                  <button
                    onClick={() => {
                      setSelectedQuoteForPortal(quote);
                      setIsClientPortalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#172036] hover:bg-[#222a3d] text-white border border-[#2d3449] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#4edea3]" />
                    <span>Open in Client Portal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 3 & 4: Active Projects & Smart Resource Allocation */}
      {(activePipelineStage === 'all' || activePipelineStage === 'projects' || activePipelineStage === 'payments') && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#adc6ff]/20 text-[#adc6ff] text-xs font-mono font-bold flex items-center justify-center">
                3 &amp; 4
              </span>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Activated Projects &amp; Smart Resource Allocation</span>
                  <span className="text-xs font-mono text-[#86948a] font-normal">
                    (Stripe Deposit Verified &bull; Capacity-Aware Matching)
                  </span>
                </h2>
              </div>
            </div>

            <div className="text-xs font-mono text-[#86948a]">
              Smart Match Formula: Quals (40%) + Free Capacity (35%) + Rating (25%)
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 sm:p-5 rounded-xl bg-[#0b1326] border border-[#222a3d] space-y-4"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs mb-1">
                      <span className="px-2 py-0.5 rounded bg-[#3b82f6]/15 text-[#adc6ff] font-bold">
                        {project.projectCode}
                      </span>
                      <span className="text-white font-medium">{project.clientCompany}</span>
                      <span className="text-[#86948a]">&bull;</span>
                      <span className="text-[#4edea3]">Contract: ${project.contractValue.toLocaleString()}</span>
                      <span className="text-[#86948a]">&bull;</span>
                      <span className="text-[#86948a]">Deposit Cleared: ${project.depositPaid.toLocaleString()}</span>
                    </div>

                    <h3 className="text-base font-bold text-white font-sans">
                      {project.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase ${
                        project.status === 'delivered'
                          ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30'
                          : 'bg-[#3b82f6]/20 text-[#adc6ff] border border-[#3b82f6]/30'
                      }`}
                    >
                      {project.status.toUpperCase()}
                    </span>

                    {project.status !== 'delivered' && (
                      <button
                        onClick={() => handleSignOffQaAndDeliver(project.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-[0.98]"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sign-Off QA &amp; Deliver</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[#86948a] text-[11px]">
                    <span>Execution Milestones ({project.completionPercent}% Completed)</span>
                    <span>Target Due: {project.targetDueDate}</span>
                  </div>
                  <div className="w-full h-2 bg-[#131b2e] rounded-full overflow-hidden border border-[#222a3d]">
                    <div
                      className="h-full bg-gradient-to-r from-[#3b82f6] to-[#4edea3] transition-all duration-500"
                      style={{ width: `${project.completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Assignment & Estimator Capacity Card */}
                <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#222a3d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#86948a] mb-1 font-bold">
                      Assigned Takeoff Resources
                    </div>
                    {project.assignments.length > 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#0566d9] text-white flex items-center justify-center font-bold text-xs">
                          {project.assignments[0].assignedUserName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {project.assignments[0].assignedUserName}
                            <span className="text-[11px] text-[#4edea3] ml-2">
                              (Matched Score: {project.assignments[0].matchedScorePercent || 96}%)
                            </span>
                          </div>
                          <div className="text-[11px] text-[#86948a]">
                            {project.assignments[0].roleOnProject} &bull; {project.assignments[0].allocatedWeeklyHours}h/wk allocated
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#ffb356]">
                        <Clock className="w-4 h-4" />
                        <span>Evaluating team availability &amp; qualifications...</span>
                      </div>
                    )}
                  </div>

                  {project.assignments.length === 0 && (
                    <button
                      onClick={() => runSmartResourceAllocation(project)}
                      className="px-3 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold cursor-pointer transition-colors"
                    >
                      Run Smart Allocation
                    </button>
                  )}
                </div>

                {/* QA 4-Point Protocol Checklist Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div
                    className={`p-2 rounded border flex items-center gap-1.5 ${
                      project.qaReviewProtocol.specComplianceVerified
                        ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                        : 'bg-[#131b2e] border-[#222a3d] text-[#86948a]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Spec Compliance</span>
                  </div>
                  <div
                    className={`p-2 rounded border flex items-center gap-1.5 ${
                      project.qaReviewProtocol.doubleTakeoffRecountPassed
                        ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                        : 'bg-[#131b2e] border-[#222a3d] text-[#86948a]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Variance &lt; 0.5%</span>
                  </div>
                  <div
                    className={`p-2 rounded border flex items-center gap-1.5 ${
                      project.qaReviewProtocol.materialPricingVerified
                        ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                        : 'bg-[#131b2e] border-[#222a3d] text-[#86948a]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Pricing Verified</span>
                  </div>
                  <div
                    className={`p-2 rounded border flex items-center gap-1.5 ${
                      project.qaReviewProtocol.seniorAuditorSignoff
                        ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                        : 'bg-[#131b2e] border-[#222a3d] text-[#86948a]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Senior Auditor Sign-off</span>
                  </div>
                </div>

                {/* Unlocked Deliverables in Vault */}
                {project.deliverables && project.deliverables.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#132728] border border-[#4edea3]/40 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2 text-[#4edea3]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{project.deliverables.length} Deliverable Packages Unlocked in Client Portal Vault</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedQuoteForPortal(quotes.find((q) => q.id === project.quoteId) || quotes[0]);
                        setIsClientPortalOpen(true);
                      }}
                      className="text-xs text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View in Client Vault</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals for Complete Deliverables */}
      <DatabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <ApiEventFlowViewer
        isOpen={isApiFlowModalOpen}
        onClose={() => setIsApiFlowModalOpen(false)}
        events={events}
        onTriggerSimulatedEvent={(eventType) => {
          logWebhookEvent(
            eventType,
            'StripeWebhook',
            'PAY-2024-TEST',
            'Simulated payment intent succeeded test webhook trigger.'
          );
        }}
      />

      <LogicRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
        onSaveRules={(updated) => setRules(updated)}
      />

      <ClientPortalModal
        isOpen={isClientPortalOpen}
        onClose={() => setIsClientPortalOpen(false)}
        quote={selectedQuoteForPortal}
        activeProject={projects.find((p) => p.quoteId === selectedQuoteForPortal.id)}
        onApproveAndPayDeposit={handleClientApproveAndPay}
      />

      <QuotationBuilderModal
        isOpen={isQuoteBuilderOpen}
        onClose={() => setIsQuoteBuilderOpen(false)}
        intakeRequest={selectedIntake}
        onCreateQuote={handleCreateQuote}
      />

      <IntakeRequestModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        intakeItem={selectedIntake}
        onConvertToQuote={(item) => {
          setSelectedIntake(item);
          setIsQuoteBuilderOpen(true);
        }}
        onCreateNewIntake={handleCreateNewIntake}
      />
    </div>
  );
};
