import { useState } from "react";

const partners = [
  {
    name: "HD Saison",
    color: "from-red-600 to-red-800",
    border: "border-red-500/50",
    accent: "text-red-400",
    info: "Lãi suất từ 0% - 1.5%/tháng • Vay tối đa 100 triệu • Duyệt trong 15 phút",
  },
  {
    name: "FE Credit",
    color: "from-blue-600 to-blue-800",
    border: "border-blue-500/50",
    accent: "text-blue-400",
    info: "Lãi suất từ 0% - 1.8%/tháng • Vay tối đa 70 triệu • Duyệt trong 30 phút",
  },
  {
    name: "Home Credit",
    color: "from-green-600 to-green-800",
    border: "border-green-500/50",
    accent: "text-green-400",
    info: "Lãi suất từ 0% - 2.0%/tháng • Vay tối đa 80 triệu • Duyệt trong 20 phút",
  },
];

const InstallmentPage = () => {
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", amount: "", months: "12" });
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (partner) => {
    setSelectedPartner(partner);
    setSubmitted(false);
    setForm({ name: "", phone: "", amount: "", months: "12" });
  };

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.amount) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <h1 className="text-4xl font-black text-yellow-500 mb-2 uppercase">Mua Xe Trả Góp 0%</h1>
        <div className="h-1 w-24 bg-yellow-500 rounded-full mb-10"></div>

        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Tại sao nên trả góp */}
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Tại sao nên mua trả góp?</h3>
            <ul className="space-y-3 text-gray-300">
              <li>✅ Sở hữu ngay siêu phẩm chỉ với <strong className="text-white">20% trả trước</strong>.</li>
              <li>✅ Lãi suất ưu đãi <strong className="text-white">0%</strong> trong 12 tháng đầu.</li>
              <li>✅ Thủ tục đơn giản, xét duyệt online trong <strong className="text-white">15 phút</strong>.</li>
            </ul>
          </div>

          {/* Đối tác tài chính */}
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold mb-2">Đối tác tài chính</h3>
            <p className="text-sm text-gray-400 mb-4">Chọn đối tác để đăng ký trả góp ngay:</p>
            <div className="flex gap-3 flex-wrap">
              {partners.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleSelect(p)}
                  className={`bg-white text-slate-900 font-bold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95
                    ${selectedPartner?.name === p.name ? "ring-2 ring-yellow-400 scale-105" : ""}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {selectedPartner && (
              <p className={`mt-4 text-sm ${selectedPartner.accent}`}>
                ℹ️ {selectedPartner.info}
              </p>
            )}
          </div>
        </div>

        {/* FORM ĐĂNG KÝ - Hiện khi chọn đối tác */}
        {selectedPartner && (
          <div className={`bg-slate-800/80 rounded-2xl border ${selectedPartner.border} p-6 mb-10 transition-all duration-300`}>
            {!submitted ? (
              <>
                <h2 className={`text-2xl font-black uppercase mb-1 ${selectedPartner.accent}`}>
                  Đăng ký trả góp — {selectedPartner.name}
                </h2>
                <p className="text-gray-400 text-sm mb-6">Điền thông tin bên dưới, tư vấn viên sẽ liên hệ trong 15 phút.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Họ tên */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Họ và tên <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Số điện thoại <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="0909.xxx.xxx"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  {/* Số tiền vay */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Số tiền cần vay <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="VD: 50.000.000"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  {/* Kỳ hạn */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Kỳ hạn trả góp</label>
                    <select
                      value={form.months}
                      onChange={(e) => setForm({ ...form, months: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition"
                    >
                      <option value="6">6 tháng</option>
                      <option value="12">12 tháng</option>
                      <option value="18">18 tháng</option>
                      <option value="24">24 tháng</option>
                      <option value="36">36 tháng</option>
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!form.name || !form.phone || !form.amount}
                  className="mt-6 w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:text-gray-500 disabled:cursor-not-allowed text-slate-900 font-black py-3 rounded-xl transition-all duration-200 active:scale-95 uppercase tracking-wider"
                >
                  Gửi Đăng Ký Ngay 🚀
                </button>
              </>
            ) : (
              /* SUCCESS STATE */
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-black text-green-400 mb-2">Đăng ký thành công!</h3>
                <p className="text-gray-300 mb-1">Cảm ơn <strong className="text-white">{form.name}</strong>!</p>
                <p className="text-gray-400 text-sm mb-6">
                  Tư vấn viên sẽ liên hệ số <strong className="text-yellow-400">{form.phone}</strong> trong vòng <strong className="text-white">15 phút</strong>.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setSelectedPartner(null); }}
                  className="px-6 py-2 border border-slate-600 rounded-xl text-gray-400 hover:text-white hover:border-slate-400 transition text-sm"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        )}

        {/* THỦ TỤC */}
        <section className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Thủ tục cần chuẩn bị</h2>
          <ul className="space-y-3 text-gray-300">
            {[
              "Căn cước công dân (CCCD) gắn chip.",
              "Giấy phép lái xe (nếu có).",
              "Không cần chứng minh thu nhập (với khoản vay dưới 100 triệu)."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-yellow-400 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* LIÊN HỆ */}
        <div className="bg-green-600/20 border border-green-600 p-4 rounded-xl">
          <p className="font-bold text-green-400 text-center">
            📞 LIÊN HỆ TƯ VẤN TRẢ GÓP: <span className="text-white">0969.69.69.69</span> (Mr. Dương Duy Khang)
          </p>
        </div>

      </div>
    </div>
  );
};

export default InstallmentPage;