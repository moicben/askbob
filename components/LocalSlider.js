import React, { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Modal from 'react-modal';

Modal.setAppElement('#__next'); // Set the app element for react-modal

const CustomNextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      →
    </div>
  );
};

const CustomPrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      ←
    </div>
  );
};

const LocalSlider = ({ currentContent }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const [iframeError, setIframeError] = useState(false);

  const openModal = (url) => {
    setIframeSrc(url);
    setModalIsOpen(true);
    document.body.classList.add('no-scroll');
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setIframeSrc('');
    setIframeError(false);
    document.body.classList.remove('no-scroll');
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    responsive: [
      {
        breakpoint: 768, // Adjust the breakpoint as needed
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      {currentContent.length > 2 && (
        <div>
          <Slider {...sliderSettings}>
            {currentContent.map((local, index) => (
              <div key={index} className="local-slide" onClick={() => openModal(local.local_website)}>
                <img src={local.local_img} alt={`${local.local_title} ${local.local_request}`} />
                <h4>{local.local_title}</h4>
                <p>{local.local_address || "Private location"}</p>
                <p>{local.local_phone || "No phone registered"}</p>
                <article>
                  <span className='review-stars'>
                    {local.local_rating <= 3.3 ? '⭐⭐' : local.local_rating <= 3.9 ? '⭐⭐⭐' : local.local_rating <= 4.5 ? '⭐⭐⭐⭐' : '⭐⭐⭐⭐⭐'}
                  </span>
                  <span className='review-classic'>{local.local_rating}/5</span>
                  <p>{local.local_ratingCount} reviews</p>
                </article>
                <button>Discover company</button>
              </div>
            ))}
          </Slider>
          <hr />
        </div>
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={'PopupModal'}
      >
        <button onClick={closeModal} className="close-button">
          <i className="fas fa-times"></i>
        </button>
        {iframeError ? (
          <div>Site inaccessible</div>
        ) : (
          <div className="iframe-wrapper">
            <div className="spinner"></div>
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              title="Local Content"
              onError={handleIframeError}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default LocalSlider;