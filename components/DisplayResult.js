const DisplayResult = ({ title, desc, body }) => {
  return (
    <div className="content">
        <div dangerouslySetInnerHTML={{ __html: body }}></div>
    </div>
  );
};

export default DisplayResult;