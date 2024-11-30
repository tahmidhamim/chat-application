import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa'; // Import icons
import { FiArrowDown } from "react-icons/fi";
import HeaderBar from '../components/HeaderBar';

const Chat = () => {
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false); // Track scroll state
  const [inputBoxHeight, setInputBoxHeight] = useState(40); // Initial height of the input box
  const messageInputRef = useRef(null);
  const messageEndRef = useRef(null); // Reference for auto-scroll
  const messageHistoryRef = useRef(null); // Reference for message history container
  const navigate = useNavigate();
  const socket = io('http://localhost:5000'); // Connect to backend

  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');
    if (!token) {
      navigate('/auth');
    }

    // Fetch contact list and notifications
    const fetchContacts = () => {
      axios
        .get('http://localhost:5000/api/contacts', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setContacts(res.data);
          if (!selectedUser) {
            setSelectedUser(contacts[0]?._id);
          }
        })
        .catch((err) => console.error(err));
    };

    const fetchNotifications = () => {
      axios
        .get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setNotifications(res.data);
        })
        .catch((err) => console.error(err));
    };

    const fetchMessages = (userId) => {
      const token = localStorage.getItem('token');
      axios.get(`http://localhost:5000/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setChatMessages(res.data);
      })
      .catch((err) => console.error(err));
    };

    fetchContacts();
    fetchNotifications();
    if (selectedUser) {
      fetchMessages(selectedUser);
    }

    // Listen for new messages
    socket.on('message', (message) => {
      if ((message.sender === selectedUser && message.receiver === currentUserId)) {
        setChatMessages((prev) => [...prev, message]);
      }
      if (message.sender === currentUserId || message.receiver === currentUserId) {
        fetchContacts();
      }
    });

    socket.on('notification', (message) => {
      // Re-fetch contacts to reflect the updated order
      if (message === currentUserId) {
        fetchContacts();
        fetchNotifications();
      }
    });
  }, [navigate, selectedUser]);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!isScrolledUp || (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].sender === currentUserId)) {
      // Scroll to the bottom of the message history
      scrollToBottom();
    }
  }, [chatMessages]);

  // Monitor scroll position in message history
  useEffect(() => {
    const handleScroll = () => {
      if (messageHistoryRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messageHistoryRef.current;
        // const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // Allow small margin
        const isAtBottom = scrollTop >= -10; // Allow small margin
        setIsScrolledUp(!isAtBottom); // Set state based on scroll position
      }
    };

    const historyDiv = messageHistoryRef.current;
    if (historyDiv) {
      historyDiv.addEventListener("scroll", handleScroll);
      return () => historyDiv.removeEventListener("scroll", handleScroll); // Cleanup
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  // Scroll to the bottom function
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  
    if (query.trim()) {
      const token = localStorage.getItem('token');
      axios
        .get(`http://localhost:5000/api/users/search?username=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const currentUserId = localStorage.getItem('userId');
          const inContacts = [];
          const notInContacts = [];
  
          res.data.forEach((user) => {
            if (user._id !== currentUserId) {
              if (contacts.some((contact) => contact._id === user._id)) {
                inContacts.push(user);
              } else {
                notInContacts.push(user);
              }
            }
          });
  
          setSearchResults([...inContacts, ...notInContacts]);
        })
        .catch((err) => console.error(err));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddContact = (userId) => {
    const token = localStorage.getItem('token');
    axios
      .post('http://localhost:5000/api/notifications',
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        socket.emit('notification', userId); // Emit the notification
      })
      .catch((err) => console.error(err));
  };

  const handleNotificationAction = (notificationId, senderId, action) => {
    const token = localStorage.getItem('token');
    axios
      .post(
        `http://localhost:5000/api/notifications/${notificationId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        // Refresh notifications and contacts
        axios
          .all([
            axios.get('http://localhost:5000/api/contacts', {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get('http://localhost:5000/api/notifications', {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ])
          .then(([contactsRes, notificationsRes]) => {
            setContacts(contactsRes.data);
            if (!selectedUser) {
              setSelectedUser(contacts[0]?._id);
            }
            setNotifications(notificationsRes.data);
          });
        socket.emit('notification', senderId); // Emit the notification
      })
      .catch((err) => console.error(err));
  };

  const handleSendMessage = () => {
    const trimmedMessage = currentMessage.trim(); // Remove leading/trailing spaces or new lines
    if (trimmedMessage) {
      const token = localStorage.getItem('token');
      const currentUserId = localStorage.getItem('userId');
      const message = { content: trimmedMessage, sender: currentUserId, receiver: selectedUser };
      socket.emit('message', message); // Emit the message
      axios
        .post(
          'http://localhost:5000/api/messages',
          message,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
          setChatMessages((prev) => [...prev, message]);
          setCurrentMessage('');
          if (messageInputRef.current) {
            messageInputRef.current.style.height = '40px'; // Reset height
          }
        });
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputResize = (e) => {
    const input = e.target;
    input.style.height = '40px'; // Reset height
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`; // Max height: 120px
    setInputBoxHeight(input.offsetHeight); // Update state with the new height
  };

  const parseMessage = (message) => {
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
    const urls = message.match(urlRegex);
    const texts = message.split(urlRegex);
    let output = [texts[0]];
    for (let i = 0; i < urls?.length; i++) {
      output.push(urls[i]);
      output.push(texts[i + 1]);
    }
    return output;
  }  

  return (
    <div className="h-screen flex flex-col">
      {/* Header Bar */}
      <HeaderBar
        notifications={notifications}
        handleNotificationAction={handleNotificationAction}
        handleLogout={handleLogout}
      />
      
      {/* Chat Content */}
      <div className="flex flex-grow pt-16 h-full">
        {/* Left Panel */}
        <div className="w-1/3 bg-gray-100 border-r flex flex-col">
          {/* Search Bar */}
          <div className="p-3 px-5 bg-white border-b fixed w-1/3">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex-grow overflow-y-auto mt-16">
            {(searchQuery ? searchResults : contacts).map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user._id)}
                className={`flex justify-between items-center mb-1 cursor-pointer p-3 px-6 border-b ${
                    selectedUser === user._id
                      ? 'bg-gray-300'
                      : 'hover:bg-gray-200'
                  }`}
              >
                {/* Profile Icon */}
                <FaUserCircle className="text-gray-500 text-xl mr-2 size-10" />

                {/* Username */}
                <span className="flex-grow">{user.username}</span>
      
                {/* Add Button for Non-Contact Users */}
                {searchQuery && !contacts.some((contact) => contact._id === user._id) && (
                  <button
                    onClick={() => handleAddContact(user._id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="w-2/3 flex flex-col">
          {/* Chat Bar */}
          <div className="flex items-center cursor-pointer p-2 px-4 border-b bg-gray-200 shadow-sm">
            {/* Profile Icon */}
            <FaUserCircle className="text-gray-500 text-xl mr-2 size-12" />
            <h2 className="text-lg font-semibold">
              {contacts.filter((contact) => contact._id === selectedUser)[0]?.username}
            </h2>
          </div>
          {/* Chat History */}
          <div
            className="flex-grow overflow-y-auto px-16 py-3 mb-16 flex flex-col-reverse"
            ref={messageHistoryRef} // Reference for scroll tracking
          >
            {/* Reference for scrolling */}
            <div ref={messageEndRef} />
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-1 flex ${
                  msg.sender === selectedUser ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg max-w-3xl ${
                    msg.sender === selectedUser
                      ? 'bg-gray-200'
                      : 'bg-blue-500 text-white'
                  }`}
                  style={{ whiteSpace: "pre-wrap" }} // Preserve new lines
                >
                  {/* Parse and render message content */}
                  {parseMessage(msg.content).map((part, index) =>
                    index % 2 === 0 ? (
                      part
                    ) : (
                      <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white-500 underline"
                      >
                        {part}
                      </a>
                    )
                  )}
                </div>
              </div>
            )).reverse()}
            {/* Scroll to Bottom Icon */}
            {isScrolledUp && ( // Conditionally render the down arrow
              <div
                className="absolute right-3 bg-blue-500 p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-600"
                onClick={scrollToBottom}
                title="Scroll to bottom"
                style={{
                  bottom: `${inputBoxHeight + 36}px`, // Position adjusted based on input box height
                }}
              >
                <FiArrowDown className="text-white text-xl" />
              </div>
            )}
          </div>
          <div className="p-3 px-8 bg-white border-t fixed w-2/3 bottom-0">
            <textarea
              ref={messageInputRef}
              value={currentMessage}
              onChange={(e) => {
                setCurrentMessage(e.target.value);
                handleInputResize(e);
              }}
              onKeyDown={handleInputKeyPress}
              className="w-full p-2 border rounded resize-none overflow-hidden"
              placeholder="Type a message..."
              style={{ height: '40px' }}
            />
            <FaPaperPlane
              className="absolute right-10 bottom-7 h-6 w-6 cursor-pointer text-blue-500"
              onClick={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
