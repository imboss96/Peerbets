import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Zap, CheckCircle } from 'lucide-react';

const MaintenancePage = ({ maintenanceData }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (maintenanceData?.estimatedTime) {
      const estimatedDate = new Date(maintenanceData.estimatedTime);
      const now = new Date();
      const diff = estimatedDate - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining('Returning soon...');
      }
    }
  }, [currentTime, maintenanceData?.estimatedTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-6 rounded-full border border-yellow-500/30 animate-pulse">
              <AlertCircle className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2">Maintenance Mode</h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-sm mb-6">
            We're currently performing scheduled maintenance to improve your experience.
          </p>

          {/* Message */}
          {maintenanceData?.message && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">{maintenanceData.message}</p>
            </div>
          )}

          {/* Estimated Time */}
          {maintenanceData?.estimatedTime && (
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <span className="text-gray-400 text-sm">Estimated Return Time</span>
              </div>
              <p className="text-2xl font-bold text-white mb-2">
                {timeRemaining}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(maintenanceData.estimatedTime).toLocaleString()}
              </p>
            </div>
          )}

          {/* Status Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 text-orange-400 text-sm">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span>Maintenance in Progress</span>
            </div>
          </div>

          {/* What We're Doing */}
          <div className="bg-slate-900/30 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-bold text-white mb-3">What We're Doing:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <Zap className="w-4 h-4 text-blue-400" />
                Improving system performance
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <Zap className="w-4 h-4 text-blue-400" />
                Updating security features
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <Zap className="w-4 h-4 text-blue-400" />
                Enhancing user experience
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <Zap className="w-4 h-4 text-blue-400" />
                Database optimization
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-left mb-6">
            <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              How to Stay Updated
            </h3>
            <ul className="space-y-2 text-xs text-green-300">
              <li>✓ Refresh this page periodically</li>
              <li>✓ Follow us on social media</li>
              <li>✓ Check your email for updates</li>
              <li>✓ Visit our status page</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="text-center border-t border-slate-700/50 pt-6">
            <p className="text-xs text-gray-400 mb-3">Need assistance?</p>
            <div className="flex gap-3 justify-center">
              <a
                href="mailto:support@sparkbets.com"
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-xs transition-colors"
              >
                Email Support
              </a>
              <a
                href="https://status.sparkbets.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-xs transition-colors"
              >
                Status Page
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              System Status: <span className="text-orange-400 font-semibold">Under Maintenance</span>
            </p>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-4 bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">
            We appreciate your patience as we work to provide you with the best betting experience possible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;