import React, { useState,useEffect } from 'react'
import {Link} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux"
import { useRef } from 'react';
import {getDownloadURL, getStorage,ref, uploadBytesResumable} from "firebase/storage";
import {app} from "../firebase";
import { deleteUserFailure, deleteUserStart, deleteUserSuccess, logoutFailure, logoutStart, logoutSuccess, updateUserFailure, updateUserStart, updateUserSucces } from '../redux/user/userSlice';

function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file,setFile] = useState(undefined);
  const[imagePerc,setImagePerc] = useState(0);
  const [imageUploadError,setImageUploadError] = useState(false);
  const [formData, setFormData]= useState({});
  const dispatch = useDispatch();
  const [updateSuccess, setUpdateSuccess] = useState(false);

  
 //firebase storage
// allow read;
      //allow write : if 
    //   request.resource.size <2 *1024 * 1024 &&
    //   request.resource.contentType.matches('image/.*')

    // }
  useEffect(()=>{
    if(file){
      handleFileUpload(file);
    }
  },[file])

  const handleFileUpload = (file)=>{
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name
      const storageRef = ref(storage,fileName);
      const uploadTask = uploadBytesResumable(storageRef,file);// to see the percentage of uploading

      uploadTask.on('state_changed',
      (snapshot)=>{
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) *100
       setImagePerc(Math.round(progress));
      },
      (error)=>{
        setImageUploadError(true);
      },
      ()=>{
        getDownloadURL(uploadTask.snapshot.ref).then
        ((downloadURL)=>{
          setFormData({...formData,avatar:downloadURL});
        })
      });
  }

  const handleChange = (e)=>{
    setFormData({...formData,[e.target.id]: e.target.value})
  }
  const handleSubmit = async (e)=>{
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`,
      {
        method : 'POST',
        headers :  {'Content-Type':'application/json'},
        body : JSON.stringify(formData)
      }) 
      const data = await res.json();

      if(data.success === false){
        dispatch(updateUserFailure(data.message));
        return;
      }
      dispatch(updateUserSucces(data));
      setUpdateSuccess(true);
      
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  }
const handleDeleteUser = async()=>{
  try {
    dispatch(deleteUserStart());
    const res = await fetch(`/api/user/delete/${currentUser._id}`,{
      method : "Delete",

    })
    const data = await res.json();
    if(data.success===false){
      dispatch(deleteUserFailure(data.message));
      return;
    }
    dispatch(deleteUserSuccess(data));
    
  } catch (error) {
    dispatch(deleteUserFailure(error.message))
  }

}
const handleLogout = async()=>{
    try {
      dispatch(logoutStart());
      const res = await fetch("/api/auth/logout")
      const data = res.json();
      if(data.success===false){
        dispatch(logoutFailure(data.message));
        return
      }
      dispatch(logoutSuccess(data));
    } catch (error) {
      dispatch(logoutFailure(error.message));
    }
}


  return (
    <div className='p-3 max-w-lg mx-auto'>
       <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
     <form className='gap-4 flex flex-col' onSubmit={handleSubmit}>
     <input onChange={(e)=>setFile(e.target.files[0])} type='file' hidden ref={fileRef} accept='image/*' />
     <img onClick={()=>fileRef.current.click()} src = {formData?.avatar|| currentUser.avatar} alt='profile' className='rounded-lg h-24
     w-24 object-cover cursor-pointer self-center mt-2'/>
     <p className='text-sm self-center'>
      {imageUploadError?
      (<span className='text-red-700'>Error in Image Upload(Image must be less than 2 mb)</span>)
      : imagePerc >0 && imagePerc <100 ? (
        <span className='text-slate-700'>
          {`Uploading ${(imagePerc)}%`}
        </span>)
        :
        imagePerc === 100 ?(
          <span className='text-green-700'>Image Uploaded Succesfully</span>)
          :(
          "")
        
      
      
      }
     </p>
     <input type='text' placeholder='username' className='border p-3 rounded-lg'id='username' defaultValue={currentUser.username} onChange={handleChange}/>
     <input type='text' placeholder='email' className='border p-3 rounded-lg' id='email' defaultValue={currentUser.email} onChange={handleChange} />
     <input type='text' placeholder='password' className='border p-3 rounded-lg' id='password' onChange={handleChange} />
     <button
          disabled={loading}
          className='bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Update'}
        </button>

      <Link className='bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95' to={"/create-listing"}>
          Create Listing
      </Link>
     </form>
     <div className='justify-between flex mt-5'>
      <span className='text-red-700 cursor-pointer' onClick={handleDeleteUser}>Delete account</span>
      <span className='text-red-700 cursor-pointer' onClick={handleLogout}>Sign out</span>
     </div>
     <p className='text-red-700 mt-5'>{error ? error : ''}</p>
      <p className='text-green-700 mt-5'>
        {updateSuccess ? 'User is updated successfully!' : ''}
      </p>
    </div>
   
  )
}

export default Profile