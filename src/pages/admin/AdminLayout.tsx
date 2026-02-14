import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';

export const AdminLayout: React.FC = () => {
  const { currentAuthUser, user, authRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if user has admin role
  const effectiveRole = user?.role || authRole;
  if (effectiveRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const adminName = user?.full_name || currentAuthUser?.username || 'Admin';
  const adminId = user?.id || (currentAuthUser as any)?.userId || 'Unknown';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen || !isMobile} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader
          adminName={adminName}
          adminId={adminId}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-16 pb-4">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
