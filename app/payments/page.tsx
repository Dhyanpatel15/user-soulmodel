"use client";

import { useEffect, useState } from "react";
import { paymentsApi, walletApi, mediaUrl, unwrapList, unwrapItem } from "@/lib/api";
import { CheckCircle, XCircle, CreditCard, Wallet, Plus, Loader2 } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, walletRes] = await Promise.all([
        paymentsApi.getPaymentHistory().catch(() => null),
        walletApi.getWallet().catch(() => null),
      ]);

      const paymentsList = unwrapList(paymentsRes);
      const walletItem = walletRes ? unwrapItem(walletRes) : null;

      setPayments(paymentsList);
      setWallet(walletItem);
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

      // If backend returns updated wallet directly
      const maybeWallet = depositRes?.wallet || depositRes?.data?.wallet || null;

      if (maybeWallet) {
        setWallet(maybeWallet);
      } else {
        // safest option: reload wallet from server after deposit
        const freshWallet = await walletApi.getWallet().catch(() => null);
        setWallet(freshWallet ? unwrapItem(freshWallet) : wallet);
      }

      // optionally refresh history too
      const freshPayments = await paymentsApi.getPaymentHistory().catch(() => null);
      setPayments(unwrapList(freshPayments));

      setDepositMsg(`Successfully deposited $${amount.toFixed(2)}`);
      setDepositAmount("");
    } catch (e: any) {
      setDepositMsg(e?.message || "Deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  const totalSpent = payments
    .filter((p) =>
      ["paid", "completed", "success"].includes(String(p?.status || "").toLowerCase())
    )
    .reduce((acc, p) => acc + Number(p?.amount || 0), 0);

  if (loading) return <Spinner text="Loading payments..." />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payments</h1>
      <p className="text-gray-500 text-sm mb-8">Billing history and wallet</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#e8125c] to-rose-500 text-white rounded-2xl p-5 shadow-md">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Total Spent</p>
          <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
          <p className="text-white/60 text-xs mt-2">All time</p>
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
          <h2 className="font-semibold text-gray-800">Transaction History</h2>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((pay: any) => {
              const status = String(pay?.status || "paid").toLowerCase();
              const isSuccess = ["paid", "completed", "success"].includes(status);

              const creator = pay?.creator || pay?.recipient || {};
              const creatorName =
                creator?.display_name ||
                creator?.full_name ||
                creator?.username ||
                pay?.creator_name ||
                pay?.provider ||
                "Payment";

              const avatar = creator?.avatar || creator?.avatar_url || "";

              return (
                <div key={pay.id} className="flex items-center gap-4 px-5 py-4">
                  {avatar ? (
                    <img
                      src={mediaUrl(avatar)}
                      alt={creatorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-[#e8125c] font-bold text-sm">
                      {creatorName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{creatorName}</p>
                    <p className="text-xs text-gray-400">
                      {pay?.created_at
                        ? new Date(pay.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${Number(pay?.amount || 0).toFixed(2)}
                    </p>
                    <div
                      className={`flex items-center gap-1 text-xs justify-end ${
                        isSuccess ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {isSuccess ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      <span className="capitalize">{status}</span>
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