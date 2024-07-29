import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const user = useRecoilValue(userAtom);

  useEffect(() => {
    if (!user?._id) return;

    const socket = io("https://gamifybeta-1.onrender.com", {
      query: {
        userId: user?._id,
      },
      transports: ["websocket"],
    });
    setSocket(socket);

    socket.on("connect_error", (err) => {
      console.error("Connection error: ", err);
    });

    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Cleanup function for disconnection
    return () => {
      if (socket) {
        socket.off("connect_error");
        socket.off("getOnlineUsers");
        socket.off("disconnect");
        socket.close();
      }
    };
  }, [user?._id]);

  console.log("online users ", onlineUsers);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
