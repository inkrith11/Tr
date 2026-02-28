import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import {
  getAdminToken,
  setAdminToken,
  removeAdminToken,
  getAdminUser,
  setAdminUser,
  getDashboardStats,
  getRecentActivity,
  getUsers,
  banUser,
  unbanUser,
  deleteUser,
  getReports,
  reviewReport,
  getActivityLog,
} from '../../services/adminService';

vi.mock('../../services/api', () => ({
  default: vi.fn((config) => Promise.resolve({ data: { success: true } })),
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('stores and retrieves admin token', () => {
      setAdminToken('test-token');
      expect(getAdminToken()).toBe('test-token');
    });

    it('removes admin token and user', () => {
      setAdminToken('test-token');
      setAdminUser({ name: 'Admin' });
      removeAdminToken();
      expect(getAdminToken()).toBeNull();
      expect(getAdminUser()).toBeNull();
    });
  });

  describe('User Storage', () => {
    it('stores and retrieves admin user', () => {
      const user = { name: 'Admin', role: 'admin' };
      setAdminUser(user);
      expect(getAdminUser()).toEqual(user);
    });

    it('returns null when no user is stored', () => {
      expect(getAdminUser()).toBeNull();
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      setAdminToken('mock-token');
    });

    it('getDashboardStats calls correct endpoint', async () => {
      await getDashboardStats();
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/admin/dashboard/stats',
        })
      );
    });

    it('getRecentActivity calls with limit param', async () => {
      await getRecentActivity(5);
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/admin/dashboard/activity?limit=5',
        })
      );
    });

    it('getUsers builds query params correctly', async () => {
      await getUsers({ search: 'john', role: 'admin', page: 2 });
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: expect.stringContaining('/admin/users?'),
        })
      );
      const calledUrl = api.mock.calls[0][0].url;
      expect(calledUrl).toContain('search=john');
      expect(calledUrl).toContain('role=admin');
      expect(calledUrl).toContain('page=2');
    });

    it('banUser sends PUT with reason', async () => {
      await banUser(1, { reason: 'spam', duration_days: 7 });
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put',
          url: '/admin/users/1/ban',
          data: { reason: 'spam', duration_days: 7 },
        })
      );
    });

    it('unbanUser sends PUT request', async () => {
      await unbanUser(1);
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put',
          url: '/admin/users/1/unban',
        })
      );
    });

    it('deleteUser sends DELETE request', async () => {
      await deleteUser(1);
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'delete',
          url: '/admin/users/1',
        })
      );
    });

    it('getReports builds query params correctly', async () => {
      await getReports({ status: 'pending', page: 1 });
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: expect.stringContaining('/admin/reports?'),
        })
      );
      const calledUrl = api.mock.calls[0][0].url;
      expect(calledUrl).toContain('status=pending');
    });

    it('reviewReport sends PUT with data', async () => {
      await reviewReport(5, { status: 'resolved', admin_notes: 'handled' });
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put',
          url: '/admin/reports/5/review',
          data: { status: 'resolved', admin_notes: 'handled' },
        })
      );
    });

    it('getActivityLog builds query params', async () => {
      await getActivityLog({ action: 'ban_user', page: 1 });
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: expect.stringContaining('/admin/activity-log?'),
        })
      );
      const calledUrl = api.mock.calls[0][0].url;
      expect(calledUrl).toContain('action=ban_user');
    });

    it('includes auth header when token exists', async () => {
      await getDashboardStats();
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });
  });
});
