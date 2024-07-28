import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useShowToast from "./useShowToast";
import { baseUrl } from "../url";

const useGetUserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { username } = useParams();
  const showToast = useShowToast();
  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("in user profile get hook  page", { username });
        const res = await fetch(`${baseUrl}/api/users/profile/${username}`, {
          method: "GET",
          credentials: "include", // Include credentials such as cookies
        });
        const data = await res.json();
        // const res = await axios.get(`/api/users/profile/${username}`);
        console.log("1", data);
        if (data.error) {
          console.log(data.error);
          showToast("Error", data.error, "error");
        }
        setUser(data);
      } catch (error) {
        console.log(error);
        showToast("Error", error, "error");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [username, showToast]);
  return { loading, user };
};

export default useGetUserProfile;
