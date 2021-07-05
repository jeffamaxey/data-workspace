import React, { useState } from "react";
import {Modal, Button, Form, Input, notification, Select} from 'antd';
import TextArea from "antd/es/input/TextArea";
import {getCookie} from "../utils/common";

export default function ShareQueryModal({ visible, query, onClose, onSent }) {
  const [isSending, setIsSending] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState([]);
  const [email, setEmail] = useState();

  const validateMessages = {
    required: '${label} is required!',
  }
  const [form] = Form.useForm();
  const onOk = () => {
    form.submit();
  };

  const sendQuery = formValues => {
    setIsSending(true);
    formValues.message += `\n\nhttps://data.trade.gov.uk/data-explorer/?sql=${encodeURIComponent(query)}`;
    fetch(`/data-explorer/api/share-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-CSRFToken': getCookie('data_workspace_csrf'),
        },
        body: JSON.stringify(formValues),
      })
      .then(function(resp) {
        if (resp.ok) return resp.json();
        notification.error({
          message: 'Error sharing query',
          description: 'An unknown error occurred while trying to share your query.',
        });
        setIsSending(false);
        throw new Error('Failed to share query');
      })
        .then(resp => {
          setIsSending(false);
          onClose();
          notification.success({
            message: 'Query shared',
            description: 'Your query has been sent to the specified recipient.',
          });
        });
  }

  const onSearch = value => {
    if (value) {
      fetch(`/data-explorer/api/user-emails?email=${value}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
      })
        .then(resp => resp.json())
        .then(resp => {
          setEmailAddresses(resp.results);
        })
   } else {
      setEmailAddresses([]);
    }
  };

  const onCancel = () => {
    setIsSending(false);
    onClose();
  }

  return (
    <Modal
      title="Share query"
      visible={visible}
      onCancel={() => onCancel()}
      onOk={onOk}
      confirmLoading={isSending}
      width={800}
    >
      <Form.Provider
        onFormFinish={(name, { values }) => {
          sendQuery(values.query);
        }}
      >
         <Form
          form={form}
          validateMessages={validateMessages}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 17 }}
        >
          <Form.Item
            name={['query', 'recipient']}
            label="Recipient"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              value={email}
              placeholder="Start typing an email address"
              defaultActiveFirstOption={false}
              showArrow={false}
              filterOption={false}
              onSearch={onSearch}
              onChange={value => setEmail(value)}
              notFoundContent={null}
            >
              {emailAddresses.map(email => (
                <Select.Option key={email}>{email}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name={['query', 'message']}
            label="Message"
            initialValue={
              'Hi,\n\n' +
              'I thought you might find this SQL query useful.\n\n' +
              'If you already have access to the data, you can access the query in Data Explorer by visiting the link below.\n\n' +
              'You may need to request access to Data Explorer before you can use it: https://data-services-help.trade.gov.uk/data-workspace/how-articles/data-workspace-basics/how-do-i-request-access-tool/.\n\n' +
              'Please note this query has been shared with you for internal (DIT) use only.'
            }
          >
            <TextArea
              rows={13}
            />
          </Form.Item>
         </Form>
      </Form.Provider>
    </Modal>
  )
}
