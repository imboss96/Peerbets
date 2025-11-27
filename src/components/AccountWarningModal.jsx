import React, { useState, useEffect } from 'react';
import { AlertCircle, Phone, Mail, X } from 'lucide-react';

const AccountWarningModal = ({ warning, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!warning || !isVisible) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'from-red-600 to-red-900';
      case 'high':
        return 'from-orange-600 to-orange-900';
      case 'medium':
        return 'from-yellow-600 to-yellow-900';
      default:
        return 'from-blue-600 to-blue-900';
    }
  };

  const getSeverityIcon = (type) => {
    switch (type) {
      case 'suspended':
        return '⚠️';
      case 'banned':
        return '❌';
      case 'restricted':
        return '🚫';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br ${getSeverityColor(warning.severity)} rounded-xl max-w-md w-full p-6 border-2 border-white/20 shadow-2xl`}>
        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon and Title */}
        <div className="mb-4">
          <div className="text-4xl mb-3">{getSeverityIcon(warning.type)}</div>
          <h2 className="text-2xl font-bold text-white mb-1">{warning.title}</h2>
          <p className="text-white/90">{warning.message}</p>
        </div>

        {/* Reason */}
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <p className="text-xs text-white/70 mb-1">Reason:</p>
          <p className="text-white font-semibold">{warning.reason}</p>
        </div>

        {/* Date Info */}
        {warning.suspendedAt && (
          <div className="bg-white/10 rounded-lg p-3 mb-4">
            <p className="text-xs text-white/70 mb-1">
              {warning.type === 'suspended' ? 'Suspended on:' : 'Since:'}
            </p>
            <p className="text-white font-semibold">
              {new Date(warning.suspendedAt).toLocaleString()}
            </p>
          </div>
        )}

        {warning.bannedAt && (
          <div className="bg-white/10 rounded-lg p-3 mb-4">
            <p className="text-xs text-white/70 mb-1">Banned on:</p>
            <p className="text-white font-semibold">
              {new Date(warning.bannedAt).toLocaleString()}
            </p>
          </div>
        )}

        {warning.restrictions && warning.restrictions.length > 0 && (
          <div className="bg-white/10 rounded-lg p-3 mb-4">
            <p className="text-xs text-white/70 mb-2">Restrictions:</p>
            <ul className="space-y-1">
              {warning.restrictions.map((restriction, index) => (
                <li key={index} className="text-white text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {restriction}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact Support */}
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <p className="text-white font-bold mb-3 text-sm">Contact Support:</p>
          <div className="space-y-2">
            {warning.contactEmail && (
              <a
                href={`mailto:${warning.contactEmail}`}
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors bg-white/10 hover:bg-white/20 rounded px-3 py-2"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{warning.contactEmail}</span>
              </a>
            )}
            {warning.contactPhone && (
              <a
                href={`tel:${warning.contactPhone}`}
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors bg-white/10 hover:bg-white/20 rounded px-3 py-2"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">{warning.contactPhone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-bold"
          >
            Acknowledge
          </button>
          {warning.type !== 'banned' && (
            <button
              onClick={() => window.open('mailto:support@sparkbets.com', '_blank')}
              className="w-full bg-white text-gray-900 hover:bg-white/90 px-4 py-2 rounded-lg transition-colors font-bold"
            >
              Contact Support
            </button>
          )}
        </div>

        {/* Footer Message */}
        <p className="text-xs text-white/70 mt-4 text-center">
          {warning.type === 'banned'
            ? 'This account cannot be restored'
            : 'Your account access may be restored after contacting support'}
        </p>
      </div>
    </div>
  );
};

export default AccountWarningModal;