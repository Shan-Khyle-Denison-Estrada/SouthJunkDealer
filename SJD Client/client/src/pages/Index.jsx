import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const cardData = [
  {
    id: "about",
    title: "ABOUT US",
    image: "/about_raccoon.png",
    text: "Redefining waste management in Zamboanga City by bridging sustainability with advanced AI technology. We leverage Machine Learning for precise pricing and QR systems for secure tracking, ensuring a transparent, fraud-free trading environment.",
  },
  {
    id: "mission",
    title: "MISSION",
    image: "/mission_raccoon.png",
    text: "To modernize material recovery by replacing manual inefficiencies with a secure, cloud-native platform. We provide a data-driven trading environment that guarantees fair pricing, operational excellence, and transparency for all our partners.",
  },
  {
    id: "vision",
    title: "VISION",
    image: "/vision_raccoon.png",
    text: "To set the new standard for the circular economy, creating a future where the scrap industry is a seamless, digital ecosystem. We aim to build a world defined by trust, sustainability, and continuous technological innovation.",
  },
];

const faqData = [
  {
    question: "What materials do you accept?",
    answer:
      "We accept a wide range of scrap materials including copper, aluminum, steel, brass, and electronic waste. Our AI systems help categorize and price these efficiently.",
  },
  {
    question: "How does the AI pricing work?",
    answer:
      "Our system analyzes market trends and material quality in real-time to provide the most competitive and fair pricing available, removing the guesswork from trading.",
  },
  {
    question: "Is there a minimum weight requirement?",
    answer:
      "We cater to both small household recyclers and large industrial suppliers. While there is no strict minimum, larger bulks may qualify for premium transport services.",
  },
  {
    question: "How do I get paid?",
    answer:
      "We offer instant payouts via digital wallets (GCash, Maya) or bank transfer immediately upon successful verification and weighing of your materials.",
  },
];

const Index = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const location = useLocation();

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="font-sans text-slate-900">
      {/* --- HERO SECTION --- */}
      <div className="relative h-screen w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-[url('/large_bg.png')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90"></div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          {/* Animated Badge */}
          <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 animate-fade-in-down">
            <span className="w-2 h-2 rounded-full bg-[#F2C94C] animate-pulse"></span>
            <span className="text-white text-xs md:text-sm font-medium tracking-wide uppercase">
              The Future of Scrap Trading
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight drop-shadow-xl">
            Smart Recycling for a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F2C94C] to-yellow-200">
              Greener Tomorrow
            </span>
          </h1>

          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed font-light">
            South Junk Dealer connects you to the circular economy with
            AI-driven pricing, secure transactions, and hassle-free pickups.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* LINKED BUTTON */}
            <Link
              to="/auth/register"
              className="px-8 py-4 bg-[#F2C94C] hover:bg-yellow-400 text-slate-900 text-lg font-bold rounded-full shadow-lg hover:shadow-yellow-400/30 transition-all transform hover:-translate-y-1 flex items-center justify-center"
            >
              Get Started
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>

            <button
              onClick={() =>
                document
                  .getElementById("about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 text-lg font-bold rounded-full transition-all flex items-center justify-center"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* --- INFO CARDS SECTION (About, Mission, Vision) --- */}
      <div className="bg-slate-50 py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {cardData.map((card) => (
            <div
              key={card.id}
              id={card.id}
              className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col items-center text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="w-24 h-24 mb-6 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-[#F2C94C]/20 transition-colors">
                {/* Fallback if image missing, though images are preferred */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
                {card.title}
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* --- FAQ SECTION --- */}
      <div id="faqs" className="py-24 px-6 bg-white relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-[#F2C94C] uppercase tracking-widest mb-2">
              Got Questions?
            </h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            {faqData.map((item, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex justify-between items-center p-6 md:p-8 text-left"
                >
                  <span className="font-bold text-lg md:text-xl text-slate-800 pr-4">
                    {item.question}
                  </span>
                  <span
                    className={`text-2xl font-bold transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    } text-[#F2C94C]`}
                  >
                    {openIndex === index ? "−" : "+"}
                  </span>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    openIndex === index
                      ? "max-h-[300px] opacity-100 p-6 md:p-8 pt-0"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
