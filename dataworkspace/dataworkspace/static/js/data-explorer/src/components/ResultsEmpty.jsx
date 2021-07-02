import React from 'react';
import { Empty } from "antd";

export default function ResultsEmpty() {
  return (
    <div className="no-query">
      <Empty description="Run a query to see some data" /></div>
  )
}
