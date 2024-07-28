import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Input,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { GiConversation } from "react-icons/gi";
import Conversation from "../components/Conversation";
import MessageContainer from "../components/MessageContainer";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";
import { baseUrl } from "../url";

const ChatPage = () => {
  //states
  const [loadingConversation, setLoadingConversations] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);

  //hooks
  const showToast = useShowToast();

  //context hook
  const { socket, onlineUsers } = useSocket();

  //recoils
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const currentUser = useRecoilValue(userAtom);
  const [conversations, setConversations] = useRecoilState(conversationsAtom);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/messages/conversations`, {
          credentials: "include",
        });

        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setConversations(data);
        console.log(data);
      } catch (error) {
        showToast("Error", error.message, "error");
      } finally {
        setLoadingConversations(false);
      }
    };
    getConversations();
  }, [showToast, setConversations]);

  useEffect(() => {
    socket?.on("messagesSeen", ({ conversationId }) => {
      setConversations((prev) => {
        const updatedConversations = prev.map((conversation) => {
          if (conversation._id === conversationId) {
            return {
              ...conversation,
              lastMessage: {
                ...conversation.lastMessage,
                seen: true,
              },
            };
          }
          return conversation;
        });
        return updatedConversations;
      });
    });
  }, [socket, setConversations]);

  const handleConversationSearch = async (e) => {
    e.preventDefault();
    setSearchingUser(true);
    if (!searchText) {
      setSearchingUser(false);
      return;
    }
    try {
      console.log("in chat page", searchText);
      const res = await fetch(`${baseUrl}/api/users/profile/${searchText}`, {
        method: "GET",
        credentials: "include", // Include credentials such as cookies
      });
      const searchedUser = await res.json();

      if (searchedUser.error) {
        showToast("Error", searchedUser.error, "error");
        return;
      }

      //if user is trying to msg themselves
      const messagingYourSelf = searchedUser._id === currentUser._id;
      if (messagingYourSelf) {
        showToast("Error", "You cannot message yourself", "error");
        return;
      }

      //already have a conversation with the user so directly open the chat
      const conversationAlreadyExists = conversations.find(
        (conversation) => conversation.participants[0]._id === searchedUser._id
      );
      if (conversationAlreadyExists) {
        setSelectedConversation({
          _id: conversationAlreadyExists._id,
          userId: searchedUser._id,
          userProfilePic: searchedUser.profilePic,
          username: searchedUser.username,
        });
        return;
      }

      //searching for a user we dont have a chat with
      //creating a new chat
      //we will create a mock(fake) conversation first bcoz if the user just sees
      //and doesnt send a messasge so the conversation should not be created
      const mockConversation = {
        mock: true,
        lastMessage: {
          text: "",
          sender: "",
        },
        _id: Date.now(),
        participants: [
          {
            _id: searchedUser._id,
            username: searchedUser.username,
            profilePic: searchedUser.profilePic,
          },
        ],
      };

      setConversations((prevConversation) => [
        ...prevConversation,
        mockConversation,
      ]);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setSearchingUser(false);
    }
  };
  return (
    <Box
      position={"absolute"}
      left={"50%"}
      w={{
        sm: "100%",
        md: "80%",
        lg: "1000px",
      }}
      p={4}
      transform={"translateX(-50%)"}
    >
      <Flex
        gap={4}
        flexDirection={{
          base: "column",
          md: "row",
        }}
        maxW={{
          sm: "400px",
          md: "full",
        }}
        mx={"auto"}
      >
        <Flex
          flex={30}
          gap={2}
          flexDirection={"column"}
          maxW={{
            sm: "250px",
            md: "full",
          }}
          mx={"auto"}
        >
          <Text
            fontWeight={700}
            color={useColorModeValue("gray.600", "gray.400")}
          >
            Your Conversations
          </Text>
          <form onSubmit={handleConversationSearch}>
            <Flex alignItems={"center"} gap={2}>
              <Input
                placeholder="Search for a user"
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                size={"sm"}
                onClick={handleConversationSearch}
                isLoading={searchingUser}
              >
                <SearchIcon />
              </Button>
            </Flex>
          </form>

          {loadingConversation &&
            [0, 1, 2, 3, 4].map((_, i) => (
              <Flex
                gap={4}
                key={i}
                alignItems={"center"}
                p={"1"}
                borderRadius={"md"}
              >
                <Box>
                  <SkeletonCircle size={"10"} />
                </Box>

                <Flex w={"full"} flexDirection={"column"} gap={3}>
                  <Skeleton h={"10px"} w={"80px"} />
                  <Skeleton h={"8px"} w={"90%"} />
                </Flex>
              </Flex>
            ))}

          {!loadingConversation &&
            conversations.map((conversation) => (
              <Conversation
                key={conversation._id}
                //checking if user we cahtting with is in onlinusers array
                isOnline={onlineUsers.includes(
                  conversation.participants[0]._id
                )}
                conversation={conversation}
              />
            ))}
        </Flex>
        {!selectedConversation._id && (
          <Flex
            flex={70}
            borderRadius={"md"}
            p={2}
            flexDirection={"column"}
            alignItems={"center"}
            justifyContent={"center"}
            height={"400px"}
          >
            <GiConversation size={100} />
            <Text fontSize={20}>Select a conversation to start messaging</Text>
          </Flex>
        )}

        {selectedConversation._id && <MessageContainer />}
      </Flex>
    </Box>
  );
};

export default ChatPage;
