import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-display font-bold text-xl text-emerald-400 mb-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-black">D</span>
              </div>
              DIETORA
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered personalized diet planning tailored for Pakistani families. Healthy eating within your budget.
            </p>
            <p className="text-xs mt-4 text-slate-600">FYP Project — University of Agriculture Faisalabad</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About</Link></li>
              <li><Link to="/faq" className="hover:text-emerald-400 transition-colors">FAQ</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-emerald-400 transition-colors cursor-default">AI Meal Plans</span></li>
              <li><span className="hover:text-emerald-400 transition-colors cursor-default">Budget Optimizer</span></li>
              <li><span className="hover:text-emerald-400 transition-colors cursor-default">Grocery Lists</span></li>
              <li><span className="hover:text-emerald-400 transition-colors cursor-default">Progress Tracking</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-xs text-center text-slate-600">
          © {new Date().getFullYear()} DIETORA. Built with ❤️ for healthier Pakistan.
        </div>
      </div>
    </footer>
  )
}
