import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaUserCircle } from "react-icons/fa";

const HeaderBar = ({ notifications, handleNotificationAction, handleLogout }) => {
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full flex justify-between items-center p-4 bg-gray-800 text-white fixed top-0 justify-end">
      <h1 className="text-lg font-bold">Chat</h1>
      <div className="flex items-center relative">
        {/* Notification Icon */}
        <div ref={notificationRef} className="relative">
          <FaBell
            className="text-xl cursor-pointer"
            onClick={() => setNotificationOpen(!isNotificationOpen)}
          />
          {notifications.length > 0 && (
            <span
              className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2 cursor-pointer"
              onClick={() => setNotificationOpen(!isNotificationOpen)}
            >
              {notifications.length}
            </span>
          )}
          {isNotificationOpen && (
            <div className="absolute top-8 right-0 mt-2 w-64 bg-white text-black rounded shadow-lg overflow-y-auto max-h-80 z-10">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex justify-between items-center p-2 border-b"
                  >
                    <span>{notification.senderUsername}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          handleNotificationAction(notification.id, notification.senderId, "accepted")
                        }
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          handleNotificationAction(notification.id, notification.senderId, "rejected")
                        }
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-500">No notifications</p>
              )}
            </div>
          )}
        </div>

        {/* Profile Icon */}
        <div ref={profileRef} className="relative ml-4">
          <FaUserCircle
            className="text-2xl ml-4 h-8 w-8 cursor-pointer"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          />
          {dropdownVisible && (
            <div className="absolute top-10 right-0 bg-white shadow-md mt-2 rounded">
              <button
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={() => setDropdownVisible(false)}
              >
                Settings
              </button>
              <button
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
