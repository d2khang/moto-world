import React from 'react';

const WarrantyPage = () => {
  const sections = [
    {
      number: "1",
      title: "Thời hạn bảo hành",
      borderColor: "border-green-500/50",
      titleColor: "text-green-400",
      numberBg: "bg-green-500",
      content: (
        <>
          <p className="mb-4 text-white font-medium">
            Tất cả các dòng xe mua tại <span className="text-green-400 font-black">MOTO WORLD</span> đều được hưởng chế độ:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
              <span><strong className="text-white">1 năm</strong> hoặc <strong className="text-white">12.000 Km</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
              <span>Bảo hành <strong className="text-white">12 tháng</strong> cho các chi tiết độ lắp đặt tại shop.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      number: "2",
      title: "Gói Bảo Dưỡng & Desmo Service",
      borderColor: "border-blue-500/50",
      titleColor: "text-blue-400",
      numberBg: "bg-blue-500",
      content: (
        <>
          <p className="mb-4 text-white font-medium">
            Để "chiến mã" luôn ở trạng thái đỉnh cao, chúng tôi cung cấp gói bảo dưỡng tiêu chuẩn mỗi{' '}
            <span className="text-yellow-400 font-black">3.000 KM</span>:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
              <div>
                <strong className="text-white">Bảo dưỡng định kỳ (Mỗi 3.000 Km):</strong>
                <p className="text-sm mt-1 text-gray-400">- Thay nhớt, lọc nhớt chính hãng.<br />- Vệ sinh nhông sên dĩa, kiểm tra bố thắng, áp suất lốp.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
              <div>
                <strong className="text-white">Desmo Service (Gói Cao Cấp):</strong>
                <p className="text-sm mt-1 text-gray-400">- Kiểm tra và canh chỉnh khe hở xupap (Desmodromic) chuẩn kỹ thuật.<br />- Vệ sinh họng ga, kim phun, thay nước mát và dầu thắng.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg shrink-0">🎁</span>
              <span className="italic text-green-400 font-bold">Đặc biệt: Miễn phí công thợ cho 3 lần bảo dưỡng đầu tiên.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      number: "3",
      title: 'Đặc Quyền "Chơi Là Phải Độ"',
      borderColor: "border-yellow-500/50",
      titleColor: "text-yellow-400",
      numberBg: "bg-yellow-500",
      content: (
        <>
          <p className="mb-4 text-white font-medium">
            MOTO WORLD <span className="text-yellow-400 font-black">VẪN BẢO HÀNH</span> cho xe đã thay đổi kết cấu:
          </p>
          <ul className="space-y-3">
            {[
              "Chấp nhận bảo hành xe đã thay Pô (Exhaust), Map lại ECU.",
              "Chấp nhận xe đã cắt đuôi, độ dàn áo, thay đổi tư thế lái.",
              "Hỗ trợ canh chỉnh map máy miễn phí trọn đời cho anh em mua xe tại shop."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-yellow-400 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )
    },
    {
      number: "4",
      title: "Trường hợp từ chối",
      borderColor: "border-red-500/50",
      titleColor: "text-red-400",
      numberBg: "bg-red-500",
      content: (
        <>
          <p className="mb-4 text-white font-medium">Bảo hành sẽ không được áp dụng trong các trường hợp sau:</p>
          <ul className="space-y-3">
            {[
              "Xe bị tai nạn nặng biến dạng khung sườn.",
              "Hư hỏng do thiên tai, ngập nước quá mức cho phép."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <h1 className="text-4xl font-black text-green-500 mb-2 uppercase">
          Chính Sách Bảo Hành & Bảo Dưỡng
        </h1>
        <div className="h-1 w-24 bg-green-500 rounded-full mb-10"></div>

        {/* SECTIONS */}
        <div className="space-y-6 text-gray-300">
          {sections.map((section) => (
            <section
              key={section.number}
              className={`bg-slate-800/60 p-6 rounded-2xl border ${section.borderColor} relative`}
            >
              {/* Number Badge */}
              <div className={`absolute -top-4 left-6 w-8 h-8 ${section.numberBg} rounded-full flex items-center justify-center font-black text-slate-900 text-sm shadow-lg`}>
                {section.number}
              </div>

              <h2 className={`text-xl font-bold ${section.titleColor} mb-4 uppercase mt-1`}>
                {section.title}
              </h2>

              {section.content}
            </section>
          ))}
        </div>

      </div>
    </div>
  );
};

export default WarrantyPage;