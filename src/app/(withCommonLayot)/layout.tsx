import React from "react";

const WithCommonlayout = ({ children }: { children: React.ReactNode }) => {
  return <main>{children}</main>;
};

export default WithCommonlayout;
