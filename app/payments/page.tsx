"use client";

import { useEffect, useMemo, useState } from "react";
import {
  paymentsApi,
  walletApi,
  mediaUrl,
  unwrapItem,
} from "@/lib/api";
import {
  CheckCircle,
  XCircle,
  CreditCard,
  Wallet,
  Plus,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import Spinner from "@/components/Spinner";

type TransactionItem = {
  id: string | number;
  type: "credit" | "debit";
  amount: number;
  status: string;
  title: string;
  subtitle?: string;
  created_at?: string | null;
  avatar?: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");

  const loadData = async () => {
    setLoading(true);

    try {
      const [paymentsRes, walletRes, txRes] = await Promise.all([
        paymentsApi.getPaymentHistory().catch(() => []),
        walletApi.getWallet().catch(() => null),
        walletApi.getTransactions().catch(() => []),
      ]);

      setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
      setWalletTransactions(Array.isArray(txRes) ? txRes : []);
      setWallet(walletRes ? unwrapItem(walletRes) : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);

    if (!amount || amount <= 0) {
      setDepositMsg("Please enter a valid amount");
      return;
    }

    setDepositing(true);
    setDepositMsg("");

    try {
      const depositRes = await walletApi.deposit(amount);

      const maybeWallet = depositRes?.wallet || depositRes?.data?.wallet || null;

      if (maybeWallet) {
        setWallet(maybeWallet);
      } else {
        const freshWallet = await walletApi.getWallet().catch(() => null);
        setWallet(freshWallet ? unwrapItem(freshWallet) : wallet);
      }

      const [freshPayments, freshTransactions] = await Promise.all([
        paymentsApi.getPaymentHistory().catch(() => []),
        walletApi.getTransactions().catch(() => []),
      ]);

      setPayments(Array.isArray(freshPayments) ? freshPayments : []);
      setWalletTransactions(Array.isArray(freshTransactions) ? freshTransactions : []);

      setDepositMsg(`Successfully deposited $${amount.toFixed(2)}`);
      setDepositAmount("");
    } catch (e: any) {
      setDepositMsg(e?.message || "Deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  const normalizedTransactions = useMemo<TransactionItem[]>(() => {
    const successfulStatuses = ["paid", "completed", "success", "succeeded"];
    const creditKeywords = ["credit", "deposit", "topup", "top_up", "refund", "added"];
    const debitKeywords = ["debit", "spent", "payment", "purchase", "subscription", "unlock", "deducted"];

    const walletTxList: TransactionItem[] = walletTransactions.map((tx: any, index: number) => {
      const rawType = String(
        tx?.type ||
        tx?.transaction_type ||
        tx?.entry_type ||
        tx?.kind ||
        ""
      ).toLowerCase();

      const rawStatus = String(tx?.status || "success").toLowerCase();
      const amount = Number(tx?.amount || 0);

      const isCredit =
        creditKeywords.some((k) => rawType.includes(k)) ||
        amount > 0 && !debitKeywords.some((k) => rawType.includes(k));

      const type: "credit" | "debit" = isCredit ? "credit" : "debit";

      const title =
        tx?.title ||
        tx?.description ||
        tx?.label ||
        tx?.reason ||
        (type === "credit" ? "Wallet Credit" : "Wallet Debit");

      const subtitle =
        tx?.note ||
        tx?.message ||
        tx?.reference ||
        tx?.provider ||
        "";

      return {
        id: tx?.id ?? `wallet-${index}`,
        type,
        amount: Math.abs(amount),
        status: rawStatus,
        title,
        subtitle,
        created_at: tx?.created_at || tx?.date || tx?.timestamp || null,
        avatar: "",
      };
    });

    const paymentList: TransactionItem[] = payments.map((pay: any, index: number) => {
      const status = String(pay?.status || "paid").toLowerCase();
      const creator = pay?.creator || pay?.recipient || {};
      const creatorName =
        creator?.display_name ||
        creator?.full_name ||
        creator?.username ||
        pay?.creator_name ||
        pay?.provider ||
        "Payment";

      const amount = Number(pay?.amount || 0);

      return {
        id: pay?.id ?? `payment-${index}`,
        type: "debit",
        amount: Math.abs(amount),
        status,
        title: creatorName,
        subtitle: pay?.provider_transaction_id || pay?.provider || "Payment",
        created_at: pay?.created_at || null,
        avatar: creator?.avatar || creator?.avatar_url || "",
      };
    });

    const merged = [...walletTxList, ...paymentList];

    const uniqueMap = new Map<string, TransactionItem>();

    for (const item of merged) {
      const key = `${item.id}-${item.type}-${item.amount}-${item.created_at}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [payments, walletTransactions]);

  const successfulStatuses = ["paid", "completed", "success", "succeeded"];

  const totalCredited = normalizedTransactions
    .filter((t) => t.type === "credit" && successfulStatuses.includes(t.status))
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalDebited = normalizedTransactions
    .filter((t) => t.type === "debit" && successfulStatuses.includes(t.status))
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalSpent = totalDebited;

  if (loading) return <Spinner text="Loading payments..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payments</h1>
      <p className="text-gray-500 text-sm mb-8">
        Wallet balance, credits, debits and full transaction history
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#e8125c] to-rose-500 text-white rounded-2xl p-5 shadow-md">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Total Spent</p>
          <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
          <p className="text-white/60 text-xs mt-2">All debit transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-[#e8125c]" />
            <p className="text-gray-400 text-xs uppercase tracking-wider">Wallet Balance</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${Number(wallet?.balance ?? 0).toFixed(2)}
          </p>
          <p className="text-gray-400 text-xs mt-2">Available</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={16} className="text-green-600" />
            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Credited</p>
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${totalCredited.toFixed(2)}
          </p>
          <p className="text-gray-400 text-xs mt-2">All credits</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-red-500" />
            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Debited</p>
          </div>
          <p className="text-3xl font-bold text-red-500">
            ${totalDebited.toFixed(2)}
          </p>
          <p className="text-gray-400 text-xs mt-2">All debits</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={18} className="text-[#e8125c]" />
          <h2 className="font-semibold text-gray-800">Add Funds</h2>
        </div>

        {depositMsg && (
          <div
            className={`mb-3 p-3 rounded-xl text-sm ${
              depositMsg.toLowerCase().includes("success")
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-red-50 text-red-600 border border-red-100"
            }`}
          >
            {depositMsg}
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#e8125c] transition-colors"
            />
          </div>

          <button
            onClick={handleDeposit}
            disabled={depositing || !depositAmount}
            className="px-5 py-2.5 bg-[#e8125c] hover:bg-[#c4104f] text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {depositing && <Loader2 size={14} className="animate-spin" />}
            Deposit
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {[5, 10, 25, 50].map((amt) => (
            <button
              key={amt}
              onClick={() => setDepositAmount(String(amt))}
              className="flex-1 py-1.5 bg-gray-50 hover:bg-pink-50 hover:text-[#e8125c] border border-gray-200 hover:border-pink-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard size={18} className="text-[#e8125c]" />
          <h2 className="font-semibold text-gray-800">Payment Method</h2>
        </div>

        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
          <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">VISA</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">•••• •••• •••• 4242</p>
            <p className="text-xs text-gray-400">Expires 12/27</p>
          </div>
          <button className="ml-auto text-xs text-[#e8125c] font-medium hover:underline">
            Change
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">All Transactions</h2>
        </div>

        {normalizedTransactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No transactions yet
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {normalizedTransactions.map((item) => {
              const isSuccess = successfulStatuses.includes(String(item.status || "").toLowerCase());
              const isCredit = item.type === "credit";

              return (
                <div key={`${item.id}-${item.type}-${item.created_at}`} className="flex items-center gap-4 px-5 py-4">
                  {item.avatar ? (
                    <img
                      src={mediaUrl(item.avatar)}
                      alt={item.title}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCredit
                          ? "bg-green-100 text-green-600"
                          : "bg-pink-100 text-[#e8125c]"
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.subtitle || (isCredit ? "Money added to wallet" : "Money spent")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isCredit ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {isCredit ? "+" : "-"}${Number(item.amount || 0).toFixed(2)}
                    </p>

                    <div
                      className={`flex items-center gap-1 text-xs justify-end ${
                        isSuccess ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {isSuccess ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      <span className="capitalize">
                        {item.status || (isSuccess ? "success" : "failed")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}