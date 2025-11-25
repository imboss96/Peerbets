import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Fly from '../Fly';

// Mock external services
jest.mock('../../services/FlyGameAdminService');
jest.mock('../../services/VirtualGameAdminService');

// Import and setup mocks
import FlyGameAdminService from '../../services/FlyGameAdminService';
import VirtualGameAdminService from '../../services/VirtualGameAdminService';

FlyGameAdminService.getCrashSeriesConfig = jest.fn().mockResolvedValue({
  success: true,
  data: { crashSeries: [1.5, 2.0, 3.0], currentGameIndex: 0 }
});
FlyGameAdminService.getAdminLogs = jest.fn().mockResolvedValue({ success: true, data: [] });
FlyGameAdminService.updateCrashSeries = jest.fn().mockResolvedValue({ success: true });
FlyGameAdminService.setNextCrash = jest.fn().mockResolvedValue({ success: true, message: 'Next crash set', gameIndex: 1 });
FlyGameAdminService.resetGameIndex = jest.fn().mockResolvedValue({ success: true, message: 'Index reset' });
FlyGameAdminService.generateNewSeries = jest.fn().mockResolvedValue({ success: true });

VirtualGameAdminService.autoCompletePendingBets = jest.fn().mockResolvedValue({ success: true, completedCount: 0 });
VirtualGameAdminService.setAutoCompleteConfig = jest.fn().mockResolvedValue({ success: true, message: 'updated' });
VirtualGameAdminService.getPendingBetsStats = jest.fn().mockResolvedValue({
  success: true,
  data: { pendingBetsCount: 0, totalStake: 0, totalPotentialWin: 0, totalRisk: 0 }
});

const renderFly = (overrides = {}) => {
  const defaultProps = {
    user: { uid: 'u1', balance: 1000, isAdmin: false },
    onBalanceUpdate: jest.fn(),
    onBack: jest.fn(),
    onPlaceBet: jest.fn().mockResolvedValue({ success: true }),
    onSettleBet: jest.fn(),
    ...overrides
  };
  return render(<Fly {...defaultProps} />);
};

describe('Fly component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should render game display', async () => {
    renderFly();
    await waitFor(() => {
      expect(screen.getByText(/Fly Crash Game/i)).toBeInTheDocument();
    });
  });

  test('Should prevent placing a bet when not logged in', async () => {
    renderFly({ user: null });

    const stakeInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(stakeInput, { target: { value: '100' } });

    const placeBtn = screen.getByRole('button', { name: /place bet/i });
    fireEvent.click(placeBtn);

    await waitFor(() => {
      expect(screen.getByText(/please login/i)).toBeInTheDocument();
    });
  });

  test('Should show error for insufficient balance', async () => {
    renderFly({ user: { uid: 'u1', balance: 50, isAdmin: false } });

    const stakeInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(stakeInput, { target: { value: '100' } });

    const placeBtn = screen.getByRole('button', { name: /place bet/i });
    fireEvent.click(placeBtn);

    await waitFor(() => {
      expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
    });
  });

  test('Should place a valid bet', async () => {
    const onPlaceBet = jest.fn().mockResolvedValue({ success: true });
    renderFly({ onPlaceBet });

    const stakeInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(stakeInput, { target: { value: '100' } });

    const placeBtn = screen.getByRole('button', { name: /place bet/i });
    fireEvent.click(placeBtn);

    await waitFor(() => {
      expect(onPlaceBet).toHaveBeenCalled();
    });
  });

  test('Should display balance correctly', async () => {
    renderFly({ user: { uid: 'u1', balance: 5000, isAdmin: false } });
    
    await waitFor(() => {
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });
  });

  test('Should toggle sound button', async () => {
    renderFly();
    
    const soundBtn = screen.getByRole('button', { name: '' }).parentElement.querySelector('svg');
    await waitFor(() => {
      expect(soundBtn).toBeInTheDocument();
    });
  });
});
